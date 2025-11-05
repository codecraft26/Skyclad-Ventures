import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { DocumentsService } from '../documents/documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as User } from '../common/decorators/current-user.decorator';

@ApiTags('Folders')
@Controller('folders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all primary-tag folders with document counts' })
  @ApiResponse({ status: 200, description: 'List of folders with document counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: User) {
    return this.foldersService.findAllFolders(user.sub);
  }

  @Get(':tag/docs')
  @ApiOperation({ summary: 'Get documents by folder (primary tag)' })
  @ApiParam({ name: 'tag', description: 'Primary tag name', example: 'invoices-2025' })
  @ApiResponse({ status: 200, description: 'List of documents in the folder' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

