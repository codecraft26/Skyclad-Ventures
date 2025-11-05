import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { OcrWebhookDto } from './dto/ocr-webhook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('ocr')
  async processOcr(
    @Body() payload: OcrWebhookDto,
    @CurrentUser() user: User,
  ) {
    return this.webhooksService.processOcrWebhook(payload, user.sub);
  }
}

