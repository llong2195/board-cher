import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

/**
 * Exception thrown when authentication is required but not provided.
 *
 * This exception should be used when a user attempts to access a resource
 * without valid authentication credentials.
 *
 * @example
 * ```typescript
 * if (!user) {
 *   throw new UnauthorizedException('Authentication required');
 * }
 * ```
 */
export class UnauthorizedException extends NestUnauthorizedException {
  constructor(message: string = 'Authentication required') {
    super({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    });
    this.name = 'UnauthorizedException';
  }
}
