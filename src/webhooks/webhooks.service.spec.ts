import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { AuditService } from '../audit/audit.service';
import { getModelToken } from '@nestjs/mongoose';
import { Task } from './schemas/task.schema';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let auditService: jest.Mocked<AuditService>;
  let taskModel: any;

  beforeEach(async () => {
    const mockAuditService = {
      log: jest.fn(),
    };
    const mockTaskModel = {
      create: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    auditService = module.get(AuditService);
    taskModel = module.get(getModelToken(Task.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should classify official content', async () => {
    taskModel.countDocuments.mockResolvedValue(0);

    const result = await service.processOcrWebhook(
      {
        source: 'scanner-01',
        imageId: 'img_123',
        text: 'Invoice number 12345. Payment due date.',
      },
      'userId',
    );

    expect(result.classification).toBe('official');
  });

  it('should classify ad content', async () => {
    taskModel.countDocuments.mockResolvedValue(0);
    taskModel.create.mockResolvedValue({ 
      _id: { toString: () => 'task1' } 
    });

    const result = await service.processOcrWebhook(
      {
        source: 'scanner-01',
        imageId: 'img_123',
        text: 'LIMITED TIME SALE! Buy now! unsubscribe: mailto:stop@brand.com',
      },
      'userId',
    );

    expect(result.classification).toBe('ad');
  });

  it('should extract unsubscribe details from ad', async () => {
    taskModel.countDocuments.mockResolvedValue(0);
    taskModel.create.mockResolvedValue({ 
      _id: { toString: () => 'task1' } 
    });

    const result = await service.processOcrWebhook(
      {
        source: 'scanner-01',
        imageId: 'img_123',
        text: 'LIMITED TIME SALE! unsubscribe: mailto:stop@brand.com',
      },
      'userId',
    );

    expect(result.classification).toBe('ad');
    expect(result.taskCreated).toBe('task1');
    expect(taskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        target: 'stop@brand.com',
      }),
    );
  });

  it('should respect rate limit (3 tasks per sender per day)', async () => {
    taskModel.countDocuments.mockResolvedValue(3); // Already 3 tasks today
    taskModel.create.mockResolvedValue({ 
      _id: { toString: () => 'task1' } 
    });

    const result = await service.processOcrWebhook(
      {
        source: 'scanner-01',
        imageId: 'img_123',
        text: 'LIMITED TIME SALE! unsubscribe: mailto:stop@brand.com',
      },
      'userId',
    );

    expect(result.classification).toBe('ad');
    expect(result.taskCreated).toBeUndefined(); // Task not created due to rate limit
    expect(taskModel.create).not.toHaveBeenCalled();
  });
});

