import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { BaseExceptionFilter } from './base-exception.filter';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  constructor(protected readonly i18n: I18nService) {
    super(i18n);
  }

  async catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const lang = request.acceptsLanguages(['en', 'kh']) || 'kh';

    const message = await this.getPrismaErrorMessage(exception, lang);

    const errorResponse = await this.formatError(
      HttpStatus.BAD_REQUEST,
      message,
      'Database Error',
    );

    this.sendError(response, HttpStatus.BAD_REQUEST, errorResponse);
  }

  private async getPrismaErrorMessage(
    exception: Prisma.PrismaClientKnownRequestError,
    lang: string,
  ): Promise<string> {
    const target = Array.isArray(exception.meta?.target)
      ? exception.meta?.target.join(', ')
      : exception.meta?.target;

    switch (exception.code) {
      case 'P2002':
        return this.i18n.translate('errors.prisma.unique', {
          lang,
          args: { field: target },
        });
      case 'P2014':
        return this.i18n.translate('errors.prisma.foreignKey', { lang });
      case 'P2003':
        return this.i18n.translate('errors.prisma.constraint', {
          lang,
          args: { message: exception.message },
        });
      default:
        return this.i18n.translate('errors.prisma.unknown', { lang });
    }
  }
}
