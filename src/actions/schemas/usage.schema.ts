import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsageDocument = Usage & Document;

@Schema()
export class Usage {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  credits: number;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);

UsageSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

