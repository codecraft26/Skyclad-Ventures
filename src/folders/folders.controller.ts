import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { DocumentsService } from '../documents/documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.foldersService.findAllFolders(user.sub);
  }

  @Get(':tag/docs')
  async getDocuments(
    @Param('tag') tag: string,
    @CurrentUser() user: User,
  ) {
    const documents = await this.documentsService.findByPrimaryTag(
      tag,
      user.sub,
    );
    return documents;
  }
}

