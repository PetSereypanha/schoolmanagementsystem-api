import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
}

export abstract class BaseExceptionFilter implements ExceptionFilter {
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
    host: ArgumentsHost,
  ): Promise<string | string[]> {
    const i18n = I18nContext.current(host);
    if (Array.isArray(message)) {
      const translatedMessages = await Promise.all(
        message.map(async (msg) => {
          const [key, paramsString] = msg.split('|');
          const params = paramsString ? JSON.parse(paramsString) : {};
          return i18n.translate(key, { lang, args: params });
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
