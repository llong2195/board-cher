import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { IUserRepository } from '../../domain/user/user.repository';
import { User } from '../../domain/user/user.model';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy for validating access tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'your-secret-key-here',
    });
  }

  /**
   * Validate JWT payload and return user
   * This method is called automatically by Passport after token verification
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
