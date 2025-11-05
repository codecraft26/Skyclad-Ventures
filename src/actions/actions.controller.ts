import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { RunActionDto } from './dto/run-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('run')
  async run(@Body() runActionDto: RunActionDto, @CurrentUser() user: User) {
    return this.actionsService.runAction(
      runActionDto.scope,
      runActionDto.messages,
      runActionDto.actions,
      user.sub,
    );
  }

  @Get('usage/month')
  async getUsage(
    @Query('userId') userId?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @CurrentUser() user?: User,
  ) {
    // If userId provided and user is admin, return that user's usage
    // Otherwise return current user's usage
    const targetUserId = userId && user?.role === 'admin' ? userId : user?.sub;

    if (!targetUserId) {
      return { credits: 0 };
    }

    const credits = await this.actionsService.getUsageForMonth(
      targetUserId,
      month ? parseInt(month.toString()) : undefined,
      year ? parseInt(year.toString()) : undefined,
    );

    return { userId: targetUserId, credits };
  }
}

