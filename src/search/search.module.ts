import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { DocumentsModule } from '../documents/documents.module';
import { FoldersModule } from '../folders/folders.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [DocumentsModule, FoldersModule, TagsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

