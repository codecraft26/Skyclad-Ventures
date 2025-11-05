import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
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

