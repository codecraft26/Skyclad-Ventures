import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: 'pending' })
  status: string; // pending, completed, failed

  @Prop({ type: String })
  channel?: string; // email, url

  @Prop({ type: String })
  target?: string; // unsubscribe URL or email

  @Prop({ required: true, index: true })
  senderId: string; // extracted from webhook (source + imageId or meta)

  @Prop({ type: Date })
  createdAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, senderId: 1, createdAt: 1 });
TaskSchema.index({ status: 1 });

