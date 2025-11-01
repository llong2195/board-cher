import { IsString, MinLength } from 'class-validator';

/**
 * DTO for token refresh
 */
export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken!: string;
}
