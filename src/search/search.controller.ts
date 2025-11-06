import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search across documents with optional scope filtering' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'invoice' })
  @ApiQuery({ name: 'scope', enum: ['folder', 'files'], required: false, description: 'Search scope - either folder or files' })
  @ApiQuery({ name: 'folder', required: false, description: 'Folder name (required if scope is folder)' })
  @ApiQuery({ name: 'ids', type: String, required: false, description: 'Document IDs (comma-separated string, e.g., "doc1,doc2", required if scope is files)' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot use both folder scope and ids filter' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.searchService.search(
      query.q,
      user.sub,
      query.scope,
      query.folder,
      query.ids,
    );
  }
}

