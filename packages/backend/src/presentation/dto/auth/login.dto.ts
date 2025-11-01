import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for user login
 */
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
