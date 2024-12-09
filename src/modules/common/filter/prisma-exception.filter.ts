import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const message = this.getErrorMessage(exception);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002':
        return `Error de unicidade: O campo ${exception.meta.target} já existe.`;
      case 'P2014':
        return 'Error de restrição de chave estrangeira: O registro ainda está sendo referenciado por outro registro.';
      case 'P2003':
        return `Error de chave estrangeira - P2003: ${exception.message}`;
      default:
        return 'Error de banco de dados desconhecido.';
    }
  }
}
