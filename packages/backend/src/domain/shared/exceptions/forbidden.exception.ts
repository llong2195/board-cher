import { ForbiddenException as NestForbiddenException } from '@nestjs/common';

/**
 * Exception thrown when a user lacks permission to access a resource.
 *
 * This exception should be used when a user is authenticated but does not
 * have the required permissions to perform the requested action.
 *
 * @example
 * ```typescript
 * if (board.userId !== user.id) {
 *   throw new ForbiddenException('You do not have permission to modify this board');
 * }
 * ```
 */
export class ForbiddenException extends NestForbiddenException {
  constructor(message: string = 'Insufficient permissions') {
    super({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      message,
      timestamp: new Date().toISOString(),
    });
    this.name = 'ForbiddenException';
  }
}
