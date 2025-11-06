import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usage, UsageDocument } from './schemas/usage.schema';
import { DocumentsService } from '../documents/documents.service';
import { FoldersService } from '../folders/folders.service';
import { MockProcessor } from './processors/mock-processor';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ActionsService {
  constructor(
    @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
    private documentsService: DocumentsService,
    private foldersService: FoldersService,
    private mockProcessor: MockProcessor,
  ) {}

  async runAction(
    scope: { type: string; name?: string; ids?: string[] },
    messages: Array<{ role: string; content: string }>,
    actions: string[],
    ownerId: string,
  ): Promise<any> {
    // Validate scope rule: either folder OR files, not both
    if (scope.type === 'folder' && scope.ids && scope.ids.length > 0) {
      throw new BadRequestException(
        'Cannot use both folder scope and ids filter',
      );
    }
    if (scope.type === 'files' && scope.name) {
      throw new BadRequestException(
        'Cannot use both files scope and folder name',
      );
    }

    // Collect context
    let documents: any[] = [];

    if (scope.type === 'folder') {
      if (!scope.name) {
        throw new BadRequestException('Folder name is required for folder scope');
      }
      documents = await this.documentsService.findByPrimaryTag(
        scope.name,
        ownerId,
      );
    } else if (scope.type === 'files') {
      if (!scope.ids || scope.ids.length === 0) {
        throw new BadRequestException('Document IDs are required for files scope');
      }
      documents = await Promise.all(
        scope.ids.map((id) =>
          this.documentsService.findById(id, ownerId).catch(() => null),
        ),
      );
      documents = documents.filter((d) => d !== null);
    }

    if (documents.length === 0) {
      throw new NotFoundException('No documents found in scope');
    }

    // Prepare context
    const context = documents.map((doc) => ({
      title: doc.filename,
      content: doc.textContent || '',
    }));

    // Process actions
    const { results } = await this.mockProcessor.process(
      scope,
      messages,
      actions,
      context,
    );

    // Execute actions
    const executedActions: any[] = [];

    for (const result of results) {
      if (result.action === 'make_document') {
        // Create a new document
        const fakeFile = {
          originalname: 'generated-document.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from(result.content),
        } as Express.Multer.File;

        // Create a temporary tag for generated documents
        const generatedDoc = await this.documentsService.create(
          fakeFile,
          ownerId,
          'generated',
          [],
        );
        executedActions.push({
          action: 'make_document',
          documentId: String((generatedDoc as any)._id),
        });
      } else if (result.action === 'make_csv') {
        // Generate CSV file
        const fakeFile = {
          originalname: 'generated-data.csv',
          mimetype: 'text/csv',
          buffer: Buffer.from(result.content),
        } as Express.Multer.File;

        const generatedDoc = await this.documentsService.create(
          fakeFile,
          ownerId,
          'generated',
          [],
        );
        executedActions.push({
          action: 'make_csv',
          documentId: String((generatedDoc as any)._id),
        });
      }
    }

    // Track usage (5 credits per request)
    await this.trackUsage(ownerId, 5);

    return {
      scope,
      results: executedActions,
      creditsUsed: 5,
    };
  }

  async trackUsage(userId: string, credits: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await this.usageModel.findOneAndUpdate(
      { userId, month, year },
      { $inc: { credits } },
      { upsert: true, new: true },
    );
  }

  async getUsageForMonth(userId: string, month?: number, year?: number): Promise<number> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const usage = await this.usageModel.findOne({
      userId,
      month: targetMonth,
      year: targetYear,
    });

    return usage?.credits || 0;
  }

  async getAllUsageForMonth(month?: number, year?: number): Promise<
    Array<{ userId: string; credits: number }>
  > {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const usageRecords = await this.usageModel.find({
      month: targetMonth,
      year: targetYear,
    });

    return usageRecords.map((u) => ({
      userId: u.userId,
      credits: u.credits,
    }));
  }
}

