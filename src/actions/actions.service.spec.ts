import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { DocumentsService } from '../documents/documents.service';
import { FoldersService } from '../folders/folders.service';
import { MockProcessor } from './processors/mock-processor';
import { getModelToken } from '@nestjs/mongoose';
import { Usage } from './schemas/usage.schema';

describe('ActionsService', () => {
  let service: ActionsService;
  let documentsService: jest.Mocked<DocumentsService>;
  let mockProcessor: jest.Mocked<MockProcessor>;
  let usageModel: any;

  beforeEach(async () => {
    const mockDocumentsService = {
      findByPrimaryTag: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    const mockFoldersService = {};
    const mockMockProcessor = {
      process: jest.fn(),
    };
    const mockUsageModel = {
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
        {
          provide: FoldersService,
          useValue: mockFoldersService,
        },
        {
          provide: MockProcessor,
          useValue: mockMockProcessor,
        },
        {
          provide: getModelToken(Usage.name),
          useValue: mockUsageModel,
        },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
    documentsService = module.get(DocumentsService);
    mockProcessor = module.get(MockProcessor);
    usageModel = module.get(getModelToken(Usage.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error when using both folder scope and ids', async () => {
    await expect(
      service.runAction(
        { type: 'folder', name: 'folder', ids: ['id1'] },
        [],
        ['make_document'],
        'userId',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error when folder scope without name', async () => {
    await expect(
      service.runAction(
        { type: 'folder' },
        [],
        ['make_document'],
        'userId',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error when files scope without ids', async () => {
    await expect(
      service.runAction(
        { type: 'files' },
        [],
        ['make_document'],
        'userId',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should track usage with 5 credits', async () => {
    documentsService.findByPrimaryTag.mockResolvedValue([
      {
        _id: 'doc1',
        filename: 'doc1.pdf',
        textContent: 'content',
        ownerId: 'userId',
        mime: 'application/pdf',
      } as any,
    ]);
    mockProcessor.process.mockResolvedValue({
      results: [{ action: 'make_document', content: 'content' }],
    });
    documentsService.create.mockResolvedValue({ _id: 'newDoc' } as any);
    usageModel.findOneAndUpdate.mockResolvedValue({});

    await service.runAction(
      { type: 'folder', name: 'invoices' },
      [{ role: 'user', content: 'make a document' }],
      ['make_document'],
      'userId',
    );

    expect(usageModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'userId' }),
      { $inc: { credits: 5 } },
      { upsert: true, new: true },
    );
  });
});

