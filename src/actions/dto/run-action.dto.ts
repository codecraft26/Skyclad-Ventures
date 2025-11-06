import {
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsOptional,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom decorator for class-level validation
export function IsValidScope(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidScope',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as ScopeDto;
          
          // Cannot have both name and ids
          if (obj.name && obj.ids && Array.isArray(obj.ids) && obj.ids.length > 0) {
            return false;
          }
          
          // If type is folder, name is required
          if (obj.type === 'folder' && !obj.name) {
            return false;
          }
          
          // If type is files, ids is required
          if (obj.type === 'files' && (!obj.ids || !Array.isArray(obj.ids) || obj.ids.length === 0)) {
            return false;
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as ScopeDto;
          
          // Check for mutual exclusivity first
          const hasName = obj.name && typeof obj.name === 'string' && obj.name.trim().length > 0;
          const hasIds = obj.ids && Array.isArray(obj.ids) && obj.ids.length > 0;
          
          if (hasName && hasIds) {
            return 'Cannot use both folder name and ids together. Use either type="folder" with name OR type="files" with ids.';
          }
          
          // Check required fields based on type
          if (obj.type === 'folder' && !hasName) {
            return 'Folder name is required when type is "folder"';
          }
          
          if (obj.type === 'files' && !hasIds) {
            return 'Document IDs are required when type is "files"';
          }
          
          return 'Invalid scope configuration';
        },
      },
    });
  };
}

export class ScopeDto {
  @ApiProperty({
    description: 'Scope type - either "folder" or "files". IMPORTANT: Use "folder" with name parameter OR "files" with ids parameter, NOT both.',
    enum: ['folder', 'files'],
    example: 'folder',
  })
  @IsEnum(['folder', 'files'])
  type: 'folder' | 'files';

  @ApiPropertyOptional({
    description: 'Folder name (REQUIRED if type is "folder", MUST NOT be used with ids)',
    example: 'invoices-2025',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Document IDs array (REQUIRED if type is "files", MUST NOT be used with name)',
    example: ['doc1', 'doc2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];

  @IsValidScope()
  _scopeValidation?: any;
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

