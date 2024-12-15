import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginPayload {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.invalid') })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: i18nValidationMessage('validation.format'),
  })
  email: string;

  @ApiProperty({ description: 'Password of the user', minLength: 8 })
  @MinLength(8, {
    message: i18nValidationMessage('validation.minLength', {
      min: 8,
    }),
  })
  password: string;
}
