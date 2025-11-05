import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'invoice',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Search scope - either folder or files',
    enum: ['folder', 'files'],
    example: 'folder',
  })
  @IsOptional()
  @IsIn(['folder', 'files'])
  scope?: 'folder' | 'files';

  @ApiPropertyOptional({
    description: 'Folder name (required if scope is folder)',
    example: 'invoices-2025',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Document IDs array (required if scope is files)',
    example: ['doc1', 'doc2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

