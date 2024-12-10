import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import type { I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class CustomExceptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const translatedMessages = await Promise.all(
        exceptionResponse.message.map(async (message: string) => {
          const [key, paramsString] = message.split('|');
          const params = paramsString ? JSON.parse(paramsString) : {};
          return this.i18n.translate(key, {
            lang: request.acceptsLanguages(['en', 'kh']) || 'kh',
            args: params,
          });
        }),
      );
      return response.status(status).json({
        statusCode: status,
        message: translatedMessages,
        error: 'Validation Error',
        timestamp: new Date().toISOString(),
      });
    }

    response.status(status).json({
      ...exceptionResponse,
      timestamp: new Date().toISOString(),
    });
  }
}
