import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentDocument = DocumentModel & Document;

@Schema({ timestamps: true })
export class DocumentModel {
  @Prop({ required: true, index: true })
  ownerId: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mime: string;

  @Prop({ type: String, default: '' })
  textContent: string;

  @Prop({ type: String })
  filePath?: string;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);

// Create text index for full-text search
DocumentSchema.index({ textContent: 'text', filename: 'text' });
DocumentSchema.index({ ownerId: 1 });

