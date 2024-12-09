import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    minLength: 3,
    required: false,
  })
  @MinLength(3, { message: 'Name Min 3 Character' })
  @IsString()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: 'Name can only contain alphanumeric characters',
  })
  name?: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid Email' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email format',
  })
  email?: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    required: false,
  })
  @IsEnum(UserRole, { message: 'Select Role' })
  role?: UserRole;

  @ApiProperty({
    description: 'Status of the user',
    enum: UserStatus,
    required: false,
  })
  @IsEnum(UserStatus, { message: 'Select Status' })
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'Phone number of the user',
    minLength: 9,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(9, { message: 'Phone Min 9 Character' })
  phone?: string;

  @ApiProperty({ description: 'Address of the user', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Blood type of the user', required: false })
  @IsOptional()
  @IsString()
  bloodType?: string;
}
