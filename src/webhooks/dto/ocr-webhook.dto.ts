import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OcrWebhookDto {
  @ApiProperty({
    description: 'Source identifier for the OCR scan',
    example: 'scanner-01',
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'Unique image identifier',
    example: 'img_123',
  })
  @IsString()
  imageId: string;

  @ApiProperty({
    description: 'Extracted text content from OCR',
    example: 'LIMITED TIME SALE… unsubscribe: mailto:stop@brand.com',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { address: '123 Main St' },
  })
  @IsOptional()
  @IsObject()
  meta?: any;
}

