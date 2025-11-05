import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: any;
  }): Promise<void> {
    const auditLog = new this.auditLogModel({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata,
    });
    await auditLog.save();
  }

  async findAll(
    userId?: string,
    entityType?: string,
    limit: number = 100,
  ): Promise<AuditLogDocument[]> {
    const query: any = {};
    if (userId) {
      query.userId = userId;
    }
    if (entityType) {
      query.entityType = entityType;
    }

    return this.auditLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

