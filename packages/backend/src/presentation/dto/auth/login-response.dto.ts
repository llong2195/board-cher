/**
 * DTO for login response
 */
export class LoginResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };

  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
