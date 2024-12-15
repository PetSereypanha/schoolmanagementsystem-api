import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from './base-exception.filter';

@Catch(HttpException)
export class CustomExceptionFilter extends BaseExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as {
      message: string | string[];
      error?: string;
    };
    const lang = request.acceptsLanguages(['en', 'kh']) || 'kh';

    const message = await this.translateMessage(
      exceptionResponse.message,
      lang,
      host,
    );

    const errorResponse = await this.formatError(
      status,
      message,
      status !== HttpStatus.OK ? exceptionResponse.error : undefined,
    );

    this.sendError(response, status, errorResponse);
  }
}
