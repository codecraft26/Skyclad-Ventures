import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  ownerId: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.index({ ownerId: 1, name: 1 }, { unique: true });

