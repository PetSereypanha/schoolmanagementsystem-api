
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ErrorLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          console.error(
            `[Error] ${res.statusCode} - ${req.method} - ${req.url}`,
          );
        }
      });
    } catch (error) {
      console.error(`[Middleware Error] ${error.message}`);
    }
    next();
  }
}
