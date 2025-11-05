import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { DocumentsService } from '../documents/documents.service';
import { FoldersService } from '../folders/folders.service';
import { TagsService } from '../tags/tags.service';

describe('SearchService', () => {
  let service: SearchService;
  let documentsService: jest.Mocked<DocumentsService>;
  let foldersService: jest.Mocked<FoldersService>;

  beforeEach(async () => {
    const mockDocumentsService = {
      search: jest.fn(),
    };
    const mockFoldersService = {
      getDocumentsByFolder: jest.fn(),
    };
    const mockTagsService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
        {
          provide: FoldersService,
          useValue: mockFoldersService,
        },
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    documentsService = module.get(DocumentsService);
    foldersService = module.get(FoldersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error when using both folder scope and ids', async () => {
    await expect(
      service.search('query', 'ownerId', 'folder', 'folderName', ['id1']),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error when using both files scope and folder name', async () => {
    await expect(
      service.search('query', 'ownerId', 'files', 'folderName', ['id1']),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error when folder scope without folder name', async () => {
    await expect(
      service.search('query', 'ownerId', 'folder', undefined, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('should search with folder scope', async () => {
    foldersService.getDocumentsByFolder.mockResolvedValue(['doc1', 'doc2']);
    documentsService.search.mockResolvedValue([]);

    await service.search('query', 'ownerId', 'folder', 'invoices', undefined);

    expect(foldersService.getDocumentsByFolder).toHaveBeenCalledWith(
      'invoices',
      'ownerId',
    );
    expect(documentsService.search).toHaveBeenCalledWith(
      'query',
      'ownerId',
      ['doc1', 'doc2'],
    );
  });

  it('should search with files scope', async () => {
    documentsService.search.mockResolvedValue([]);

    await service.search('query', 'ownerId', 'files', undefined, ['id1', 'id2']);

    expect(documentsService.search).toHaveBeenCalledWith(
      'query',
      'ownerId',
      ['id1', 'id2'],
    );
  });

  it('should search without scope', async () => {
    documentsService.search.mockResolvedValue([]);

    await service.search('query', 'ownerId', undefined, undefined, undefined);

    expect(documentsService.search).toHaveBeenCalledWith(
      'query',
      'ownerId',
      undefined,
    );
  });
});

