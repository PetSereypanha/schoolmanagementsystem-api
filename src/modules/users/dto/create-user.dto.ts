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
import { Exclude, Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Name of the user', minLength: 3 })
  @MinLength(3, { message: 'Name Min 3 Character' })
  @IsString()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: 'Name can only contain alphanumeric characters',
  })
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid Email' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email format',
  })
  email: string;

  @ApiProperty({ description: 'Password of the user', minLength: 8 })
  @MinLength(8, { message: 'Password Min 8 Character' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  @Exclude()
  password: string;

  @ApiProperty({ description: 'Role of the user', enum: UserRole })
  @IsEnum(UserRole, { message: 'Select Role' })
  role: UserRole;

  @ApiProperty({
    description: 'Status of the user',
    enum: UserStatus,
    required: false,
  })
  @IsEnum(UserStatus, { message: 'Select Status' })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status: UserStatus;
}
