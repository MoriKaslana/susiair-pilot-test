import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Turns every thrown error into one consistent JSON shape. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message } = this.normalise(exception);

    if (statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message,
      path: request.originalUrl ?? request.url,
      // Metadata about the error only. It never feeds business logic (APP_TODAY does that).
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }

  private normalise(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') return { statusCode: status, message: res };
      const message = (res as { message?: string | string[] }).message;
      return { statusCode: status, message: message ?? exception.message };
    }

    // http-errors style objects (e.g. malformed JSON from the body parser).
    const maybe = exception as { status?: number; statusCode?: number; message?: string };
    const status = maybe?.status ?? maybe?.statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return { statusCode: status, message: maybe.message ?? 'Bad request' };
    }

    return { statusCode: 500, message: 'Internal server error' };
  }
}
