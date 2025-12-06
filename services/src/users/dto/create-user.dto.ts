import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'User phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
