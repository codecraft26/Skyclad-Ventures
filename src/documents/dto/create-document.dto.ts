import { IsString, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Primary tag for the document (required)',
    example: 'invoices-2025',
  })
  @IsString()
  primaryTag: string;

  @ApiPropertyOptional({
    description: 'Optional secondary tags (can be array or comma-separated string)',
    example: ['financial', 'important'],
    type: [String],
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Handle comma-separated string
      return value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryTags?: string[];
}

