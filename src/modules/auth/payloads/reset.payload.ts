import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/modules/common/generated/i18n.generated';
import { SameAs } from 'src/modules/common/validator/same-as.validator';

export class ResetPayload {
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

  @ApiProperty({
    description: 'Token for reset password',
    required: true,
    example: 'xdadaf1231sss',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Password of the user',
    minLength: 8,
    required: true,
    example: 'Password@123',
  })
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

  @ApiProperty({
    description: 'Password of the user',
    minLength: 8,
    required: true,
    example: 'Password@123',
  })
  @SameAs('password')
  confirmation: string;
}
