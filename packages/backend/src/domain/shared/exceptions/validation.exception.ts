import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when request validation fails.
 *
 * This exception is used to indicate that the client has sent invalid data
 * that does not meet the validation requirements defined in DTOs.
 *
 * @example
 * ```typescript
 * if (dto.title.length < 3) {
 *   throw new ValidationException('Title must be at least 3 characters');
 * }
 * ```
 */
export class ValidationException extends BadRequestException {
  constructor(message: string | string[]) {
    super({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
    });
    this.name = 'ValidationException';
  }
}
