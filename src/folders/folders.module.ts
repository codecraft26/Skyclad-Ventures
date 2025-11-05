import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { Tag, TagSchema } from '../tags/schemas/tag.schema';
import { DocumentTag, DocumentTagSchema } from '../documents/schemas/document-tag.schema';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: DocumentTag.name, schema: DocumentTagSchema },
    ]),
    DocumentsModule,
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}

