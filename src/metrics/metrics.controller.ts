import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@CurrentUser() user: User) {
    // For admin, return all metrics; for others, return only their metrics
    const userId = user.role === 'admin' ? undefined : user.sub;
    return this.metricsService.getMetrics(userId);
  }
}

