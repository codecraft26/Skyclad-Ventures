import {
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScopeDto {
  @IsEnum(['folder', 'files'])
  type: 'folder' | 'files';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

class MessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

export class RunActionDto {
  @ValidateNested()
  @Type(() => ScopeDto)
  scope: ScopeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

