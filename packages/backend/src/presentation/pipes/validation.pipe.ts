import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Type,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Enhanced validation pipe using class-validator with strict options.
 *
 * Features:
 * - Strips unknown properties (whitelist: true)
 * - Rejects requests with unknown properties (forbidNonWhitelisted: true)
 * - Auto-transforms payloads to DTO class instances (transform: true)
 * - Provides detailed field-level validation errors
 *
 * @example
 * ```typescript
 * @Post()
 * async create(@Body() dto: CreateBoardDto) {
 *   // dto is validated and transformed automatically
 * }
 * ```
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = this.transformToClassInstance(metatype, value);
    await this.validateObject(object);

    return object;
  }

  /**
   * Transforms plain object to class instance with type conversion.
   */
  private transformToClassInstance(
    metatype: Type<unknown>,
    value: unknown,
  ): object {
    return plainToInstance(metatype, value, {
      enableImplicitConversion: false,
      excludeExtraneousValues: true,
    }) as object;
  }

  /**
   * Validates the transformed object and throws if invalid.
   */
  private async validateObject(object: object): Promise<void> {
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: this.formatValidationErrors(errors),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Checks if the metatype should be validated.
   */
  private toValidate(metatype: Type<unknown>): boolean {
    const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Formats validation errors into field-level error messages.
   */
  private formatValidationErrors(errors: ValidationError[]): Array<{
    field: string;
    message: string;
    constraints?: Record<string, string>;
  }> {
    return errors.map((error) => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      constraints: error.constraints,
    }));
  }
}
