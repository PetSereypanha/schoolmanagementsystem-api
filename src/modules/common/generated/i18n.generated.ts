import { Path } from 'nestjs-i18n';
/* prettier-ignore */
export type I18nTranslations = {
    "validation": {
        "required": string;
        "alphanumeric": string;
        "minLength": string;
        "invalid": string;
        "format": string;
        "exists": string;
        "role": string;
        "status": string;
        "uppercase": string;
        "lowercase": string;
        "number": string;
        "special_character": string;
    };
};
/* prettier-ignore */
export type I18nPath = Path<I18nTranslations>;
