import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  async processOcrWebhook(
    payload: {
      source: string;
      imageId: string;
      text: string;
      meta?: any;
    },
    userId: string,
  ): Promise<{ classification: string; taskCreated?: string }> {
    const { source, imageId, text, meta } = payload;

    // Classify content
    const classification = this.classifyContent(text);

    // Log webhook event
    await this.auditService.log({
      userId,
      action: 'webhook_ocr_received',
      entityType: 'webhook',
      entityId: imageId,
      metadata: {
        source,
        imageId,
        classification,
        textLength: text.length,
      },
    });

    let taskId: string | undefined;

    // If classified as ad, extract unsubscribe details and create task
    if (classification === 'ad') {
      const unsubscribeDetails = this.extractUnsubscribeDetails(text);

      if (unsubscribeDetails) {
        // Check rate limit: maximum 3 tasks per sender per day per user
        const canCreateTask = await this.checkRateLimit(
          userId,
          source,
          imageId,
        );

        if (canCreateTask) {
          const task = await this.taskModel.create({
            userId,
            status: 'pending',
            channel: unsubscribeDetails.type,
            target: unsubscribeDetails.target,
            senderId: this.getSenderId(source, imageId, meta),
          });

          taskId = String((task as any)._id);

          await this.auditService.log({
            userId,
            action: 'task_created',
            entityType: 'task',
            entityId: taskId,
            metadata: {
              channel: unsubscribeDetails.type,
              target: unsubscribeDetails.target,
            },
          });
        }
      }
    }

    return {
      classification,
      taskCreated: taskId,
    };
  }

  private classifyContent(text: string): 'official' | 'ad' {
    const lowerText = text.toLowerCase();

    // Financial/legal terms
    const officialTerms = [
      'invoice',
      'contract',
      'agreement',
      'legal',
      'court',
      'law',
      'payment',
      'receipt',
      'tax',
      'financial',
      'statement',
      'account',
    ];

    // Promotional terms
    const adTerms = [
      'sale',
      'discount',
      'promo',
      'offer',
      'limited time',
      'unsubscribe',
      'mailto:',
      'special offer',
      'buy now',
      'deal',
      'coupon',
    ];

    const officialCount = officialTerms.filter((term) =>
      lowerText.includes(term),
    ).length;
    const adCount = adTerms.filter((term) => lowerText.includes(term)).length;

    if (adCount > officialCount) {
      return 'ad';
    }
    return 'official';
  }

  private extractUnsubscribeDetails(text: string): {
    type: string;
    target: string;
  } | null {
    const lowerText = text.toLowerCase();

    // Look for mailto: links
    const mailtoMatch = text.match(/mailto:([^\s]+)/i);
    if (mailtoMatch) {
      return {
        type: 'email',
        target: mailtoMatch[1],
      };
    }

    // Look for unsubscribe URLs
    const urlMatch = text.match(
      /(?:unsubscribe|opt-out|optout)[\s:]+(https?:\/\/[^\s]+)/i,
    );
    if (urlMatch) {
      return {
        type: 'url',
        target: urlMatch[1],
      };
    }

    // Look for email addresses in unsubscribe context
    const emailMatch = text.match(
      /(?:unsubscribe|opt-out|optout)[\s:]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    );
    if (emailMatch) {
      return {
        type: 'email',
        target: emailMatch[1],
      };
    }

    return null;
  }

  private getSenderId(source: string, imageId: string, meta?: any): string {
    // Use source + imageId or meta.address as sender identifier
    if (meta?.address) {
      return `${source}:${meta.address}`;
    }
    return `${source}:${imageId}`;
  }

  private async checkRateLimit(
    userId: string,
    source: string,
    imageId: string,
  ): Promise<boolean> {
    const senderId = `${source}:${imageId}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskCount = await this.taskModel.countDocuments({
      userId,
      senderId,
      createdAt: { $gte: today },
    });

    return taskCount < 3;
  }

  async getTasksToday(userId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = {
      createdAt: { $gte: today },
    };

    if (userId) {
      query.userId = userId;
    }

    return this.taskModel.countDocuments(query);
  }
}

