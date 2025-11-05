import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { Usage, UsageSchema } from './schemas/usage.schema';
import { DocumentsModule } from '../documents/documents.module';
import { FoldersModule } from '../folders/folders.module';
import { MockProcessor } from './processors/mock-processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usage.name, schema: UsageSchema }]),
    DocumentsModule,
    FoldersModule,
  ],
  controllers: [ActionsController],
  providers: [ActionsService, MockProcessor],
  exports: [ActionsService],
})
export class ActionsModule {}

