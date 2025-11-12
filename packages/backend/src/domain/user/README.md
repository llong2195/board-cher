# User Module

**Domain**: User Management  
**Aggregate Root**: User  
**Module Location**: `src/domain/user/`

## Overview

The User module manages user accounts, profiles, authentication, and authorization. Users are the primary actors in the system who create and interact with boards, cards, and other entities.

## Purpose

- User registration and authentication
- Profile management (name, email, avatar)
- Password reset and email verification
- User preferences and settings
- Track user activity and online status

## Components

### Domain Model (`user.model.ts`)

```typescript
class User {
  id: string;
  email: string; // Unique
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
```

**Business Rules**:

- Email must be unique and valid format
- Password must meet security requirements (min 8 chars, complexity)
- Username must be unique (if provided)
- Inactive users cannot log in
- Email verification required for full access

**Key Methods**:

- `static create()` - Register new user
- `update()` - Update profile
- `changePassword()` - Update password with validation
- `verifyEmail()` - Mark email as verified
- `deactivate()` - Deactivate account

### Repository (`user.repository.ts`)

**Key Methods**:

- `findById(id): Promise<User | null>`
- `findByEmail(email): Promise<User | null>`
- `findByUsername(username): Promise<User | null>`
- `save(user): Promise<User>`
- `delete(id): Promise<void>`

## Data Flow

### User Registration

```text
1. POST /auth/register with RegisterDto
2. Validate email not already registered
3. Hash password with bcrypt
4. Create User via User.create()
5. Save to repository
6. Send verification email
7. Emit UserRegisteredEvent
8. Return JWT token + user data
```

### User Login

```text
1. POST /auth/login with LoginDto
2. Find user by email
3. Verify password with bcrypt
4. Check user is active and email verified
5. Generate JWT token
6. Update lastLoginAt timestamp
7. Emit UserLoggedInEvent
8. Return JWT token + user data
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  INDEX idx_users_email (email),
  INDEX idx_users_username (username)
);
```

**Relationships**:

- One-to-many with `boards` (created_by)
- One-to-many with `cards` (assigned_user_id)
- One-to-many with `comments`
- Many-to-many with `boards` (via `board_members`)

## API Endpoints

| Method | Path                    | Description                 |
| ------ | ----------------------- | --------------------------- |
| POST   | `/auth/register`        | Register new user           |
| POST   | `/auth/login`           | Login with email/password   |
| POST   | `/auth/logout`          | Logout (invalidate token)   |
| GET    | `/users/me`             | Get current user profile    |
| PATCH  | `/users/me`             | Update current user profile |
| POST   | `/auth/forgot-password` | Request password reset      |
| POST   | `/auth/reset-password`  | Reset password with token   |
| POST   | `/auth/verify-email`    | Verify email with token     |

## Performance Considerations

- **Index on email**: Fast login queries
- **Index on username**: Fast username lookup
- **Caching**: 15 minute TTL (rarely changes)
- **Password hashing**: Use bcrypt with cost factor 10
- **JWT tokens**: 7 day expiry, refresh token rotation

## Related Modules

- **Board Module** - Users create and own boards
- **Card Module** - Users assigned to cards
- **Comment Module** - Users author comments
- **Activity Module** - Tracks user actions
- **Organization Module** - Users belong to organizations
