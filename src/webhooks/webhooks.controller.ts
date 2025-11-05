import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
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
}

