import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that catches all unhandled exceptions.
 *
 * This filter provides structured error responses with consistent format,
 * comprehensive logging with context, and sanitization of sensitive data.
 *
 * @example
 * Error response format:
 * ```json
 * {
 *   "statusCode": 404,
 *   "errorCode": "BOARD_NOT_FOUND",
 *   "message": "Board with ID '123' not found",
 *   "timestamp": "2025-11-06T12:00:00.000Z",
 *   "requestId": "req-abc-123",
 *   "path": "/boards/123"
 * }
 * ```
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, request, status);

    // Log with appropriate severity
    this.logException(exception, request, status);

    // Send structured error response
    response.status(status).json(errorResponse);
  }

  /**
   * Builds a structured error response object.
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
    status: number,
  ): Record<string, any> {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const requestId = request.headers['x-request-id'] as string;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        return {
          ...exceptionResponse,
          timestamp,
          path,
          ...(requestId && { requestId }),
        };
      }

      return {
        statusCode: status,
        message: exceptionResponse,
        timestamp,
        path,
        ...(requestId && { requestId }),
      };
    }

    // For non-HTTP exceptions, return generic error (don't expose internals)
    return {
      statusCode: status,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      timestamp,
      path,
      ...(requestId && { requestId }),
    };
  }

  /**
   * Logs exception with context based on severity.
   */
  private logException(
    exception: unknown,
    request: Request,
    status: number,
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const requestId = headers['x-request-id'] as string;
    const userId = (request as any).user?.id || 'anonymous';

    const context = {
      method,
      url,
      ip,
      userAgent,
      userId,
      ...(requestId && { requestId }),
    };

    if (status >= 500) {
      // Server errors - log with full stack trace
      this.logger.error(
        `Server error: ${this.getExceptionMessage(exception)}`,
        exception instanceof Error ? exception.stack : '',
        context,
      );
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `Client error: ${this.getExceptionMessage(exception)}`,
        context,
      );
    }
  }

  /**
   * Extracts message from exception.
   */
  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    return String(exception);
  }
}
