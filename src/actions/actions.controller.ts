import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { RunActionDto } from './dto/run-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@ApiTags('Actions')
@Controller('actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('run')
  @ApiOperation({ 
    summary: 'Run scoped actions on documents (consumes 5 credits per request)',
    description: 'IMPORTANT: Scope must use either type="folder" with name parameter OR type="files" with ids parameter, NOT both.'
  })
  @ApiResponse({ status: 200, description: 'Actions executed successfully' })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid scope configuration. Cannot use both folder name and ids together. Use either type="folder" with name OR type="files" with ids.' 
  })
  @ApiResponse({ status: 404, description: 'No documents found in scope' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async run(@Body() runActionDto: RunActionDto, @CurrentUser() user: User) {
    return this.actionsService.runAction(
      runActionDto.scope,
      runActionDto.messages,
      runActionDto.actions,
      user.sub,
    );
  }

  @Get('usage/month')
  @ApiOperation({ summary: 'Get credit usage for a month (admin can view any user)' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID (admin only)' })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

