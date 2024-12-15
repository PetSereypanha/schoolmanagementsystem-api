import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { SameAs } from "src/modules/common/validator/same-as.validator";


export class NewPasswordPayload {
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
    message: i18nValidationMessage('validation.minLength', {
      min: 8,
    }),
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: i18nValidationMessage('validation.uppercase'),
  })
  @Matches(/^(?=.*[a-z])/, {
    message: i18nValidationMessage('validation.lowercase'),
  })
  @Matches(/^(?=.*[0-9])/, {
    message: i18nValidationMessage('validation.number'),
  })
  @Matches(/^(?=.*[!@#$%^&*])/, {
    message: i18nValidationMessage(
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
