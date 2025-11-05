import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Primary tag for the document (required)',
    example: 'invoices-2025',
  })
  @IsString()
  primaryTag: string;

  @ApiPropertyOptional({
    description: 'Optional secondary tags',
    example: ['financial', 'important'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  secondaryTags?: string[];
}

