import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter {
  async catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const lang = request.acceptsLanguages(['en', 'kh']) || 'kh';

    const message = this.getPrismaErrorMessage(exception, lang);

    const errorResponse = this.formatError(
      HttpStatus.BAD_REQUEST,
      message,
      'Database Error',
    );

    this.sendError(response, HttpStatus.BAD_REQUEST, errorResponse);
  }

  private getPrismaErrorMessage(
    exception: Prisma.PrismaClientKnownRequestError,
    lang: string,
  ): string {
    const target = Array.isArray(exception.meta?.target)
      ? exception.meta?.target.join(', ')
      : exception.meta?.target;

    switch (exception.code) {
      case 'P2002':
        return `Unique constraint failed on the field: ${target}`;
      case 'P2014':
        return 'Foreign key constraint failed';
      case 'P2003':
        return `Constraint failed: ${exception.message}`;
      default:
        return 'An unknown error occurred';
    }
  }

  private formatError(status: number, message: string, error: string) {
    return {
      statusCode: status,
      message,
      error,
    };
  }

  private sendError(response: any, status: number, errorResponse: any) {
    response.status(status).json(errorResponse);
  }
}
