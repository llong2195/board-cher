import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global HTTP exception filter
 * Catches all HTTP exceptions and formats error responses
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // reuse exceptionResponse defined above and normalize its shape
    type HttpExcResp =
      | string
      | { message?: string | string[]; error?: string; [key: string]: unknown };

    const body = exceptionResponse as HttpExcResp;
    const isObject = body !== null && typeof body === 'object';

    const extractMessage = (b: HttpExcResp): string => {
      if (typeof b === 'string') return b;
      if (b && 'message' in b) {
        const m = (b as { message?: string | string[] }).message;
        if (Array.isArray(m)) return m.join(', ');
        if (typeof m === 'string') return m;
        return String(m ?? '');
      }
      return exception.message || 'Internal server error';
    };

    const message = extractMessage(body);

    const error =
      isObject && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : undefined;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      ...(error ? { error } : {}),
    };

    response.status(status).json(errorResponse);
  }
}

/**
 * Global exception filter for all unhandled exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    };

    response.status(status).json(errorResponse);
  }
}
