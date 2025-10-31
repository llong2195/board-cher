/**
 * User domain model with validation logic
 * Represents an authenticated person using the application
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name: string,
    public readonly avatarUrl: string | null,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Validate user domain invariants
   */
  private validate(): void {
    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.passwordHash || this.passwordHash.length === 0) {
      throw new Error('Password hash is required');
    }

    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (this.name.length > 100) {
      throw new Error('Name must not exceed 100 characters');
    }

    if (this.avatarUrl && !this.isValidUrl(this.avatarUrl)) {
      throw new Error('Invalid avatar URL format');
    }
  }

  /**
   * Validate email format (RFC 5322 basic)
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(timestamp: Date): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.name,
      this.avatarUrl,
      timestamp,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update user profile
   */
  updateProfile(name: string, avatarUrl: string | null): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      name,
      avatarUrl,
      this.lastLoginAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update password hash
   */
  updatePassword(passwordHash: string): User {
    if (!passwordHash || passwordHash.length === 0) {
      throw new Error('Password hash is required');
    }

    return new User(
      this.id,
      this.email,
      passwordHash,
      this.name,
      this.avatarUrl,
      this.lastLoginAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Factory method to create a new user
   */
  static create(
    id: string,
    email: string,
    passwordHash: string,
    name: string,
    avatarUrl: string | null = null,
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      name,
      avatarUrl,
      null,
      new Date(),
      new Date(),
    );
  }

  /**
   * Factory method to reconstitute user from persistence
   */
  static fromPersistence(data: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    avatarUrl: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.name,
      data.avatarUrl,
      data.lastLoginAt,
      data.createdAt,
      data.updatedAt,
    );
  }
}
