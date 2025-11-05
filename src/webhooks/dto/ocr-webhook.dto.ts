import { IsString, IsObject, IsOptional } from 'class-validator';

export class OcrWebhookDto {
  @IsString()
  source: string;

  @IsString()
  imageId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsObject()
  meta?: any;
}

