import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from '../tags/schemas/tag.schema';
import { DocumentTag, DocumentTagDocument } from '../documents/schemas/document-tag.schema';

@Injectable()
export class FoldersService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(DocumentTag.name)
    private documentTagModel: Model<DocumentTagDocument>,
  ) {}

  async findAllFolders(ownerId: string): Promise<
    Array<{
      name: string;
      tagId: string;
      documentCount: number;
    }>
  > {
    // Get all tags owned by the user
    const tags = await this.tagModel.find({ ownerId }).exec();

    // For each tag, count documents where it's primary
    const folders = await Promise.all(
      tags.map(async (tag) => {
        const count = await this.documentTagModel.countDocuments({
          tagId: String((tag as any)._id),
          isPrimary: true,
        });
        return {
          name: tag.name,
          tagId: String((tag as any)._id),
          documentCount: count,
        };
      }),
    );

    // Filter out folders with 0 documents
    return folders.filter((f) => f.documentCount > 0);
  }

  async getDocumentsByFolder(
    tagName: string,
    ownerId: string,
  ): Promise<string[]> {
    // Find tag
    const tag = await this.tagModel.findOne({ name: tagName, ownerId }).exec();
    if (!tag) {
      return [];
    }

    // Find all documents with this tag as primary
    const documentTags = await this.documentTagModel
      .find({ tagId: String((tag as any)._id), isPrimary: true })
      .exec();

    return documentTags.map((dt) => dt.documentId);
  }
}

