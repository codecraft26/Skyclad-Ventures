import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { DocumentModel, DocumentSchema } from '../documents/schemas/document.schema';
import { Tag, TagSchema } from '../tags/schemas/tag.schema';
import { Usage, UsageSchema } from '../actions/schemas/usage.schema';
import { Task, TaskSchema } from '../webhooks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Usage.name, schema: UsageSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}

