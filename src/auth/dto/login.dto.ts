import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user1@example.com',
  })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'User role (optional, defaults to "user")',
    example: 'user',
    enum: ['user', 'admin', 'support', 'moderator'],
  })
  @IsOptional()
  @IsString()
  role?: string;
}

