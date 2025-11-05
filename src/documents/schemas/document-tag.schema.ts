import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentTagDocument = DocumentTag & Document;

@Schema()
export class DocumentTag {
  @Prop({ required: true, index: true })
  documentId: string;

  @Prop({ required: true, index: true })
  tagId: string;

  @Prop({ required: true, default: false })
  isPrimary: boolean;
}

export const DocumentTagSchema = SchemaFactory.createForClass(DocumentTag);

DocumentTagSchema.index({ documentId: 1, isPrimary: 1 });
DocumentTagSchema.index({ tagId: 1 });

