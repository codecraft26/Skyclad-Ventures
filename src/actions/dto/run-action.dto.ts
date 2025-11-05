import {
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScopeDto {
  @ApiProperty({
    description: 'Scope type - either folder or files',
    enum: ['folder', 'files'],
    example: 'folder',
  })
  @IsEnum(['folder', 'files'])
  type: 'folder' | 'files';

  @ApiPropertyOptional({
    description: 'Folder name (required if type is folder)',
    example: 'invoices-2025',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Document IDs (required if type is files)',
    example: ['doc1', 'doc2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

export class MessageDto {
  @ApiProperty({
    description: 'Message role',
    example: 'user',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Message content',
    example: 'make a CSV of vendor totals',
  })
  @IsString()
  content: string;
}

export class RunActionDto {
  @ApiProperty({
    description: 'Action scope',
    type: ScopeDto,
  })
  @ValidateNested()
  @Type(() => ScopeDto)
  scope: ScopeDto;

  @ApiProperty({
    description: 'Messages for the action',
    type: [MessageDto],
    example: [{ role: 'user', content: 'make a CSV of vendor totals' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiProperty({
    description: 'Actions to perform',
    example: ['make_document', 'make_csv'],
    type: [String],
    enum: ['make_document', 'make_csv'],
  })
  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

