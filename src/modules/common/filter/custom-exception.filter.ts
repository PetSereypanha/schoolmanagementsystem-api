import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { BaseExceptionFilter } from './base-exception.filter';

@Catch(HttpException)
export class CustomExceptionFilter extends BaseExceptionFilter {
  constructor(protected readonly i18n: I18nService) {
    super(i18n);
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;
    const lang = request.acceptsLanguages(['en', 'kh']) || 'kh';

    const message = await this.translateMessage(
      exceptionResponse.message,
      lang,
    );

    const errorResponse = await this.formatError(
      status,
      message,
      status !== HttpStatus.OK ? exceptionResponse.error : undefined,
    );

    this.sendError(response, status, errorResponse);
  }
}
