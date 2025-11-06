import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { OcrWebhookDto } from './dto/ocr-webhook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('ocr')
  @ApiOperation({ summary: 'Process OCR webhook event - classifies content and creates tasks if applicable' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        classification: { type: 'string', enum: ['official', 'ad'], example: 'ad' },
        taskCreated: { type: 'string', description: 'Task ID if created', example: 'task-id' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processOcr(
    @Body() payload: OcrWebhookDto,
    @CurrentUser() user: User,
  ) {
    return this.webhooksService.processOcrWebhook(payload, user.sub);
  }

  @Get('tasks/running')
  @ApiOperation({ summary: 'Get all running (pending) tasks for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of running tasks',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'task-id' },
          userId: { type: 'string', example: 'user-id' },
          status: { type: 'string', example: 'pending' },
          channel: { type: 'string', example: 'email' },
          target: { type: 'string', example: 'unsubscribe@example.com' },
          senderId: { type: 'string', example: 'source:imageId' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRunningTasks(
    @CurrentUser() user: User,
  ) {
    const tasks = await this.webhooksService.getRunningTasks(user.sub);
    
    return tasks.map((task: any) => ({
      _id: String(task._id),
      userId: task.userId,
      status: task.status,
      channel: task.channel,
      target: task.target,
      senderId: task.senderId,
      createdAt: task.createdAt,
    }));
  }
}

