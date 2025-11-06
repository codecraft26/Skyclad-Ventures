import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { FoldersService } from '../folders/folders.service';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class SearchService {
  constructor(
    private documentsService: DocumentsService,
    private foldersService: FoldersService,
    private tagsService: TagsService,
  ) {}

  async search(
    query: string,
    ownerId: string,
    scope?: 'folder' | 'files',
    folderName?: string,
    ids?: string[],
  ) {
    // Validate scope rule: either folder OR files, not both
    // Check if both folder and ids are provided (even without explicit scope)
    if (folderName && ids && ids.length > 0) {
      throw new BadRequestException(
        'Cannot use both folder and ids filter together. Use either scope=folder with folder parameter OR scope=files with ids parameter.',
      );
    }
    
    if (scope === 'folder' && ids && ids.length > 0) {
      throw new BadRequestException(
        'Cannot use both folder scope and ids filter',
      );
    }
    if (scope === 'files' && folderName) {
      throw new BadRequestException(
        'Cannot use both files scope and folder name',
      );
    }

    let documentIds: string[] | undefined;

    if (scope === 'folder') {
      if (!folderName) {
        throw new BadRequestException('Folder name is required for folder scope');
      }
      documentIds = await this.foldersService.getDocumentsByFolder(
        folderName,
        ownerId,
      );
    } else if (scope === 'files') {
      if (!ids || ids.length === 0) {
        throw new BadRequestException('Document IDs are required for files scope');
      }
      documentIds = ids;
    } else if (folderName) {
      // If folder is provided without scope, treat it as folder scope
      documentIds = await this.foldersService.getDocumentsByFolder(
        folderName,
        ownerId,
      );
    } else if (ids && ids.length > 0) {
      documentIds = ids;
    }

    return this.documentsService.search(query, ownerId, documentIds);
  }
}

