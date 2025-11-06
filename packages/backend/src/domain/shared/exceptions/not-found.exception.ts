import { NotFoundException as NestNotFoundException } from '@nestjs/common';

/**
 * Exception thrown when a requested resource is not found.
 *
 * This exception should be used when attempting to access an entity
 * that does not exist in the database.
 *
 * @example
 * ```typescript
 * const board = await this.repository.findOne(id);
 * if (!board) {
 *   throw new NotFoundException('Board', id);
 * }
 * ```
 */
export class NotFoundException extends NestNotFoundException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;

    super({
      statusCode: 404,
      errorCode: `${resource.toUpperCase()}_NOT_FOUND`,
      message,
      timestamp: new Date().toISOString(),
    });
    this.name = 'NotFoundException';
  }
}
