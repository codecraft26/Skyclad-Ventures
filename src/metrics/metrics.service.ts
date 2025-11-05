import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentModel, DocumentDocument } from '../documents/schemas/document.schema';
import { Tag, TagDocument } from '../tags/schemas/tag.schema';
import { Usage, UsageDocument } from '../actions/schemas/usage.schema';
import { Task, TaskDocument } from '../webhooks/schemas/task.schema';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async getMetrics(userId?: string): Promise<{
    docs_total: number;
    folders_total: number;
    actions_month: number;
    tasks_today: number;
  }> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total documents
    const docsQuery: any = {};
    if (userId) {
      docsQuery.ownerId = userId;
    }
    const docs_total = await this.documentModel.countDocuments(docsQuery);

    // Total folders (primary tags with documents)
    const tags = await this.tagModel.find(userId ? { ownerId: userId } : {}).exec();
    const folders_total = tags.length;

    // Actions this month
    const usageQuery: any = { month, year };
    if (userId) {
      usageQuery.userId = userId;
    }
    const usageRecords = await this.usageModel.find(usageQuery).exec();
    const actions_month = usageRecords.reduce((sum, u) => sum + u.credits, 0);

    // Tasks today
    const taskQuery: any = { createdAt: { $gte: today } };
    if (userId) {
      taskQuery.userId = userId;
    }
    const tasks_today = await this.taskModel.countDocuments(taskQuery);

    return {
      docs_total,
      folders_total,
      actions_month,
      tasks_today,
    };
  }
}

