import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentModel, DocumentDocument } from './schemas/document.schema';
import { DocumentTag, DocumentTagDocument } from './schemas/document-tag.schema';
import { TagsService } from '../tags/tags.service';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
    @InjectModel(DocumentTag.name)
    private documentTagModel: Model<DocumentTagDocument>,
    private tagsService: TagsService,
  ) {}

  async create(
    file: Express.Multer.File,
    ownerId: string,
    primaryTag: string,
    secondaryTags: string[] = [],
  ): Promise<DocumentDocument> {
    // Ensure exactly one primary tag
    if (!primaryTag) {
      throw new BadRequestException('Primary tag is required');
    }

    // Check if primary tag already exists for this document
    // (This check happens after tag creation below)

    // Create or find primary tag
    const primaryTagDoc = await this.tagsService.findOrCreate(
      primaryTag,
      ownerId,
    );

    // Create or find secondary tags
    const secondaryTagDocs = await Promise.all(
      secondaryTags.map((tagName) =>
        this.tagsService.findOrCreate(tagName, ownerId),
      ),
    );

    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Extract text content based on file type
    let textContent = '';
    try {
      if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        // Extract text from PDF
        const pdfData = await pdfParse(file.buffer);
        textContent = pdfData.text || '';
      } else if (file.mimetype.startsWith('text/') || 
                 file.originalname.toLowerCase().endsWith('.txt') ||
                 file.originalname.toLowerCase().endsWith('.csv')) {
        // Extract text from text files
        textContent = file.buffer.toString('utf-8');
      } else {
        // For other file types, try to extract as text (fallback)
        textContent = file.buffer.toString('utf-8').substring(0, 10000);
      }
    } catch (error) {
      // If text extraction fails, use filename as fallback
      console.warn(`Failed to extract text from ${file.originalname}:`, error);
      textContent = `File: ${file.originalname}`;
    }
    
    // Limit text content to reasonable size (100k chars)
    if (textContent.length > 100000) {
      textContent = textContent.substring(0, 100000);
    }

    // Create document
    const document = new this.documentModel({
      ownerId,
      filename: file.originalname,
      mime: file.mimetype,
      textContent,
      filePath,
    });
    const savedDocument = await document.save();

    // Create primary tag association
    await this.documentTagModel.create({
      documentId: String((savedDocument as any)._id),
      tagId: String((primaryTagDoc as any)._id),
      isPrimary: true,
    });

    // Create secondary tag associations
    await Promise.all(
      secondaryTagDocs.map((tag) =>
        this.documentTagModel.create({
          documentId: String((savedDocument as any)._id),
          tagId: String((tag as any)._id),
          isPrimary: false,
        }),
      ),
    );

    return savedDocument;
  }

  async findAll(ownerId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ ownerId }).exec();
  }

  async findById(id: string, ownerId: string): Promise<DocumentDocument> {
    const document = await this.documentModel
      .findOne({ _id: id, ownerId })
      .exec();
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async findByPrimaryTag(
    tagName: string,
    ownerId: string,
  ): Promise<DocumentDocument[]> {
    // Find tag
    const tag = await this.tagsService.findOrCreate(tagName, ownerId);

    // Find all documents with this tag as primary
    const documentTags = await this.documentTagModel
      .find({ tagId: String((tag as any)._id), isPrimary: true })
      .exec();

    const documentIds = documentTags.map((dt) => dt.documentId);

    // Get documents with ownerId filter
    return this.documentModel
      .find({
        _id: { $in: documentIds },
        ownerId,
      })
      .exec();
  }

  async findByTagIds(tagIds: string[], ownerId: string): Promise<DocumentDocument[]> {
    const documentTags = await this.documentTagModel
      .find({ tagId: { $in: tagIds } })
      .exec();

    const documentIds = [...new Set(documentTags.map((dt) => dt.documentId))];

    return this.documentModel
      .find({
        _id: { $in: documentIds },
        ownerId,
      })
      .exec();
  }

  async search(
    query: string,
    ownerId: string,
    documentIds?: string[],
  ): Promise<DocumentDocument[]> {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Build base query
    let baseQuery: any = { ownerId };
    if (documentIds && documentIds.length > 0) {
      baseQuery._id = { $in: documentIds };
    }

    // Try text search first
    let results: DocumentDocument[] = [];
    try {
      const textSearchQuery = {
        ...baseQuery,
        $text: { $search: query },
      };
      results = await this.documentModel.find(textSearchQuery).exec();
    } catch (error) {
      // Text index might not be available, continue to regex search
    }

    // If text search returned results, use them
    if (results.length > 0) {
      return results;
    }

    // Fallback to regex search (searches in textContent and filename)
    const regexSearchQuery = {
      ...baseQuery,
      $or: [
        { textContent: { $regex: escapedQuery, $options: 'i' } },
        { filename: { $regex: escapedQuery, $options: 'i' } },
      ],
    };

    return this.documentModel.find(regexSearchQuery).exec();
  }
}

