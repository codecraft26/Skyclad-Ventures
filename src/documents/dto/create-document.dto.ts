import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  primaryTag: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  secondaryTags?: string[];
}

