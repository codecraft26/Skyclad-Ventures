import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated system metrics (admin sees all, users see only their own)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics data',
    schema: {
      type: 'object',
      properties: {
        docs_total: { type: 'number', example: 123 },
        folders_total: { type: 'number', example: 7 },
        actions_month: { type: 'number', example: 42 },
        tasks_today: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMetrics(@CurrentUser() user: User) {
    // For admin, return all metrics; for others, return only their metrics
    const userId = user.role === 'admin' ? undefined : user.sub;
    return this.metricsService.getMetrics(userId);
  }
}

