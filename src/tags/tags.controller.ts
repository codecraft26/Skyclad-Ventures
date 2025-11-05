import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.tagsService.findAllByOwner(user.sub);
  }

  @Post()
  async create(@Body('name') name: string, @CurrentUser() user: User) {
    return this.tagsService.create(name, user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tagsService.findById(id, user.sub);
  }
}

