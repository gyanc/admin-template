import { IsOptional, IsString, IsPhoneNumber, IsEnum, IsBoolean } from 'class-validator';

export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
