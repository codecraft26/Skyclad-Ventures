import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsIn(['folder', 'files'])
  scope?: 'folder' | 'files';

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

