import { ConflictException as NestConflictException } from '@nestjs/common';

/**
 * Exception thrown when an operation conflicts with the current state.
 *
 * This exception should be used for scenarios like duplicate entries,
 * concurrent modification conflicts, or optimistic locking failures.
 *
 * @example
 * ```typescript
 * const existing = await this.repository.findByTitle(dto.title);
 * if (existing) {
 *   throw new ConflictException('A board with this title already exists');
 * }
 * ```
 */
export class ConflictException extends NestConflictException {
  constructor(message: string) {
    super({
      statusCode: 409,
      errorCode: 'CONFLICT',
      message,
      timestamp: new Date().toISOString(),
    });
    this.name = 'ConflictException';
  }
}
