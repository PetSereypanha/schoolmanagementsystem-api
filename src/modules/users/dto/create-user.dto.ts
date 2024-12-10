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
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from 'src/modules/common/generated/i18n.generated';

export class CreateUserDto {
  @ApiProperty({ description: 'Name of the user', minLength: 3 })
  @MinLength(3, {
    message: i18nValidationMessage<I18nTranslations>('validation.minLength', {
      min: 3,
    }),
  })
  @IsString()
  @Matches(/^[a-zA-Z\s]*$/, {
    message: i18nValidationMessage<I18nTranslations>('validation.alphanumeric'),
  })
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage<I18nTranslations>('validation.invalid') },
  )
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: i18nValidationMessage<I18nTranslations>('validation.format'),
  })
  email: string;

  @ApiProperty({ description: 'Password of the user', minLength: 8 })
  @MinLength(8, {
    message: i18nValidationMessage<I18nTranslations>('validation.minLength', {
      min: 8,
    }),
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: i18nValidationMessage<I18nTranslations>('validation.uppercase'),
  })
  @Matches(/^(?=.*[a-z])/, {
    message: i18nValidationMessage<I18nTranslations>('validation.lowercase'),
  })
  @Matches(/^(?=.*[0-9])/, {
    message: i18nValidationMessage<I18nTranslations>('validation.number'),
  })
  @Matches(/^(?=.*[!@#$%^&*])/, {
    message: i18nValidationMessage<I18nTranslations>(
      'validation.special_character',
    ),
  })
  password: string;

  @ApiProperty({ description: 'Role of the user', enum: UserRole })
  @IsEnum(UserRole, {
    message: i18nValidationMessage<I18nTranslations>('validation.role'),
  })
  role: UserRole;

  @ApiProperty({
    description: 'Status of the user',
    enum: UserStatus,
    required: false,
  })
  @IsEnum(UserStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.status'),
  })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status: UserStatus;
}
