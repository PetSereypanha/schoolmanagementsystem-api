import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from 'src/modules/common/generated/i18n.generated';

export class ForgotPasswordPayload {
    @ApiProperty({
        description: 'Email of the user',
        example: 'user@example.com',
    })
    @IsEmail({},
        { message: i18nValidationMessage<I18nTranslations>('validation.invalid') },
    )
    @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
        message: i18nValidationMessage<I18nTranslations>('validation.format'),
    })
    email: string;
}
