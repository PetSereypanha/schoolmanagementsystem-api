import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
}

export abstract class BaseExceptionFilter implements ExceptionFilter {
  constructor(protected readonly i18n: I18nService) {}

  abstract catch(exception: unknown, host: ArgumentsHost): Promise<void>;

  protected async formatError(
    status: number,
    message: string | string[],
    error?: string,
  ): Promise<ErrorResponse> {
    return {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  protected async translateMessage(
    message: string | string[],
    lang: string,
  ): Promise<string | string[]> {
    if (Array.isArray(message)) {
      const translatedMessages = await Promise.all(
        message.map(async (msg) => {
          const [key, paramsString] = msg.split('|');
          const params = paramsString ? JSON.parse(paramsString) : {};
          return this.i18n.translate(key, { lang, args: params });
        }),
      );
      return translatedMessages as string[];
    }
    return message;
  }

  protected sendError(
    response: Response,
    status: number,
    errorResponse: ErrorResponse,
  ): void {
    response.status(status).json(errorResponse);
  }
}
