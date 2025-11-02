import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../domain/user/user.repository';
import { User } from '../../domain/user/user.model';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService handles user authentication and token management
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = User.create(randomUUID(), email, passwordHash, name);

    // Save to repository
    const savedUser = await this.userRepository.create(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return { user: savedUser, tokens };
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    const updatedUser = user.updateLastLogin(new Date());
    await this.userRepository.update(updatedUser);

    // Generate tokens
    const tokens = await this.generateTokens(updatedUser);

    return { user: updatedUser, tokens };
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findById(payload.sub);
    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync<JwtPayload>(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      } as JwtSignOptions),
      this.jwtService.signAsync<JwtPayload>(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      } as JwtSignOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
