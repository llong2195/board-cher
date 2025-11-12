# API Documentation Guide

**Last Updated**: 2025-11-06  
**Version**: 1.0.0  
**OpenAPI Version**: 3.0.0

## Overview

This document provides comprehensive guidance on using and maintaining the API documentation for the Trello Vibe backend. We use **Swagger/OpenAPI** for interactive API documentation and **JSDoc** for inline code documentation.

## Table of Contents

- [Accessing API Documentation](#accessing-api-documentation)
- [OpenAPI Specification](#openapi-specification)
- [Documenting Endpoints](#documenting-endpoints)
- [Request/Response DTOs](#requestresponse-dtos)
- [Authentication](#authentication)
- [Error Responses](#error-responses)
- [API Versioning](#api-versioning)
- [Best Practices](#best-practices)

## Accessing API Documentation

### Interactive Swagger UI

**Development**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

The Swagger UI provides:

- ✅ Interactive API explorer (try out endpoints)
- ✅ Request/response examples
- ✅ Authentication testing
- ✅ Schema definitions

### OpenAPI JSON/YAML

**JSON Spec**: [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)  
**YAML Spec**: [http://localhost:3000/api/docs-yaml](http://localhost:3000/api/docs-yaml)

Use these endpoints to:

- Generate client SDKs (OpenAPI Generator)
- Import into API testing tools (Postman, Insomnia)
- Validate API contracts in CI/CD

### Baseline Contract

**Location**: `specs/003-backend-clean-code/contracts/openapi-baseline.json`

This file serves as the **API contract baseline** for backward compatibility validation. Any changes to existing endpoints must be validated against this baseline to ensure no breaking changes.

## OpenAPI Specification

### Configuration

**Location**: `src/main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Trello Vibe API')
  .setDescription('Kanban board management API')
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'Authorization',
    description: 'Enter JWT token',
    in: 'header',
  })
  .addTag('boards', 'Board management operations')
  .addTag('cards', 'Card management operations')
  .addTag('lists', 'List management operations')
  .addTag('users', 'User and authentication operations')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Module Organization

API endpoints are organized by **tags** (domain modules):

| Tag           | Description      | Endpoints                                             |
| ------------- | ---------------- | ----------------------------------------------------- |
| `boards`      | Board management | GET /boards, POST /boards, PATCH /boards/:id          |
| `cards`       | Card operations  | GET /cards, POST /cards, PATCH /cards/:id             |
| `lists`       | List management  | GET /lists, POST /lists, PATCH /lists/:id             |
| `users`       | User profiles    | GET /users/me, PATCH /users/:id                       |
| `auth`        | Authentication   | POST /auth/login, POST /auth/register                 |
| `comments`    | Card comments    | GET /cards/:id/comments, POST /cards/:id/comments     |
| `labels`      | Card labels      | GET /labels, POST /labels                             |
| `checklists`  | Card checklists  | GET /cards/:id/checklists, POST /cards/:id/checklists |
| `attachments` | File uploads     | POST /cards/:id/attachments, DELETE /attachments/:id  |

## Documenting Endpoints

### Controller Decorators

Use `@nestjs/swagger` decorators to document endpoints:

#### Basic Endpoint Documentation

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardController {
  @Get()
  @ApiOperation({
    summary: 'Get all boards',
    description: 'Returns all boards the authenticated user has access to',
  })
  @ApiResponse({
    status: 200,
    description: 'Boards retrieved successfully',
    type: [BoardResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(): Promise<BoardResponseDto[]> {
    // Implementation
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new board',
    description: 'Creates a new board owned by the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Board created successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    // Implementation
  }
}
```

#### Path Parameters

```typescript
@Get(':id')
@ApiOperation({ summary: 'Get board by ID' })
@ApiParam({
  name: 'id',
  type: 'string',
  description: 'Board UUID',
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
})
@ApiResponse({
  status: 200,
  description: 'Board found',
  type: BoardResponseDto,
})
@ApiResponse({
  status: 404,
  description: 'Board not found'
})
async findOne(@Param('id') id: string): Promise<BoardResponseDto> {
  // Implementation
}
```

#### Query Parameters

```typescript
@Get()
@ApiOperation({ summary: 'Search boards' })
@ApiQuery({
  name: 'search',
  required: false,
  type: String,
  description: 'Search term for board title',
  example: 'My Project',
})
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Page number (1-based)',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Items per page (max 100)',
  example: 20,
})
async search(
  @Query('search') search?: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
): Promise<PaginatedResponseDto<BoardResponseDto>> {
  // Implementation
}
```

## Request/Response DTOs

### Request DTOs

Document request bodies with `@ApiProperty`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({
    description: 'Board title',
    example: 'Q4 Product Roadmap',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Board description',
    example: 'Planning and tracking for Q4 product deliverables',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Board visibility',
    enum: ['private', 'team', 'public'],
    default: 'private',
  })
  @IsOptional()
  @IsEnum(['private', 'team', 'public'])
  visibility?: string;
}
```

### Response DTOs

Use `@Expose()` and `@Exclude()` for serialization:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class BoardResponseDto {
  @ApiProperty({
    description: 'Board UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Board title',
    example: 'Q4 Product Roadmap',
  })
  @Expose()
  title: string;

  @ApiPropertyOptional({
    description: 'Board description',
    example: 'Planning and tracking for Q4 product deliverables',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Board creation timestamp',
    example: '2025-11-06T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-06T15:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Board owner',
    type: () => UserResponseDto,
  })
  @Expose()
  owner: UserResponseDto;

  static from(board: Board): BoardResponseDto {
    return plainToInstance(BoardResponseDto, board, {
      excludeExtraneousValues: true,
    });
  }
}
```

### Nested Objects

```typescript
@ApiProperty({
  description: 'Board lists',
  type: [ListResponseDto],
})
@Expose()
@Type(() => ListResponseDto)
lists: ListResponseDto[];
```

### Enum Documentation

```typescript
export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@ApiProperty({
  description: 'Card priority level',
  enum: CardPriority,
  enumName: 'CardPriority',
  example: CardPriority.MEDIUM,
})
@IsEnum(CardPriority)
priority: CardPriority;
```

## Authentication

### Bearer Token

All protected endpoints require JWT authentication:

```typescript
@ApiBearerAuth()
@Controller('boards')
export class BoardController {
  // Endpoints
}
```

**Usage in Swagger UI**:

1. Click **"Authorize"** button (top-right)
2. Enter JWT token (without "Bearer" prefix)
3. Click **"Authorize"**
4. Token is now included in all requests

### Public Endpoints

Omit `@ApiBearerAuth()` for public endpoints:

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    // Public endpoint - no @ApiBearerAuth()
  }
}
```

## Error Responses

### Standard Error Format

All errors follow this structure (from `GlobalExceptionFilter`):

```typescript
{
  "statusCode": 404,
  "errorCode": "BOARD_NOT_FOUND",
  "message": "Board with ID 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' not found",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "path": "/boards/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requestId": "req-abc-123"
}
```

### Documenting Errors

Use `@ApiResponse` for all possible error codes:

```typescript
@Get(':id')
@ApiResponse({ status: 200, description: 'Success', type: BoardResponseDto })
@ApiResponse({
  status: 400,
  description: 'Bad Request - Invalid UUID format',
  schema: {
    example: {
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: 'Validation failed: id must be a valid UUID',
      timestamp: '2025-11-06T10:30:00.000Z',
    }
  }
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Missing or invalid JWT token'
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - User does not have access to this board'
})
@ApiResponse({
  status: 404,
  description: 'Not Found - Board does not exist'
})
async findOne(@Param('id') id: string): Promise<BoardResponseDto> {
  // Implementation
}
```

### Common HTTP Status Codes

| Code | Description           | When to Use                                          |
| ---- | --------------------- | ---------------------------------------------------- |
| 200  | OK                    | Successful GET/PATCH/DELETE                          |
| 201  | Created               | Successful POST                                      |
| 400  | Bad Request           | Validation errors, malformed input                   |
| 401  | Unauthorized          | Missing/invalid authentication                       |
| 403  | Forbidden             | Valid auth, but insufficient permissions             |
| 404  | Not Found             | Resource does not exist                              |
| 409  | Conflict              | Resource already exists, unique constraint violation |
| 422  | Unprocessable Entity  | Business rule validation failed                      |
| 500  | Internal Server Error | Unexpected server error                              |

## API Versioning

### Current Strategy

**Version**: v1 (implicit, no prefix in URL)

All endpoints are currently unversioned: `/boards`, `/cards`, etc.

### Future Versioning

When introducing breaking changes:

1. **URI Versioning** (recommended):

   ```typescript
   @Controller('v1/boards')  // Old version
   @Controller('v2/boards')  // New version
   ```

2. **Header Versioning** (alternative):

   ```typescript
   @Version('1')
   @Controller('boards')
   ```

3. **Deprecation Strategy**:
   - Support old version for 6 months
   - Add deprecation warnings to docs
   - Communicate migration plan to clients

## Best Practices

### 1. Consistent Naming

```typescript
// ✅ Good: Clear, consistent naming
@Post()
@ApiOperation({ summary: 'Create a new board' })
async create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {}

@Patch(':id')
@ApiOperation({ summary: 'Update an existing board' })
async update(@Param('id') id: string, @Body() dto: UpdateBoardDto) {}

// ❌ Bad: Inconsistent naming
@Post()
@ApiOperation({ summary: 'Add board' })
async addBoard(@Body() data: any) {}
```

### 2. Complete Documentation

```typescript
// ✅ Good: Comprehensive documentation
@ApiOperation({
  summary: 'Move card to different list',
  description: 'Updates the card\'s list and position. If position is omitted, card is placed at the end of the list.',
})
@ApiParam({ name: 'id', description: 'Card UUID' })
@ApiResponse({ status: 200, description: 'Card moved successfully', type: CardResponseDto })
@ApiResponse({ status: 404, description: 'Card or target list not found' })

// ❌ Bad: Minimal documentation
@Patch(':id/move')
async moveCard() {}
```

### 3. Example Values

```typescript
// ✅ Good: Realistic examples
@ApiProperty({
  description: 'User email address',
  example: 'john.doe@example.com',
  format: 'email',
})
email: string;

// ❌ Bad: Generic examples
@ApiProperty({
  description: 'Email',
  example: 'string',
})
email: string;
```

### 4. Validation Alignment

Ensure OpenAPI docs match validation rules:

```typescript
@ApiProperty({
  description: 'Board title',
  minLength: 1,
  maxLength: 255,  // Matches @MaxLength(255)
})
@IsString()
@MaxLength(255)
title: string;
```

### 5. Response Types

Always specify response types for auto-generated schemas:

```typescript
// ✅ Good: Explicit type
@ApiResponse({ status: 200, type: BoardResponseDto })
async findOne(): Promise<BoardResponseDto> {}

// ❌ Bad: No type information
@ApiResponse({ status: 200, description: 'Success' })
async findOne(): Promise<any> {}
```

## Workflow

### 1. Development

```bash
# Start backend server
npm run start:dev

# Access Swagger UI
open http://localhost:3000/api/docs

# Test endpoints interactively
```

### 2. Contract Validation

```bash
# Generate new OpenAPI spec
curl http://localhost:3000/api/docs-json > openapi-new.json

# Compare with baseline (manual diff or use tool)
diff specs/003-backend-clean-code/contracts/openapi-baseline.json openapi-new.json

# If backward compatible, update baseline
cp openapi-new.json specs/003-backend-clean-code/contracts/openapi-baseline.json
```

### 3. Client SDK Generation

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api/docs-json \
  -g typescript-axios \
  -o clients/typescript-sdk

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/api/docs-json \
  -g python \
  -o clients/python-sdk
```

## Related Documentation

- [Architecture Guide](./architecture.md) - System architecture and layers
- [Testing Guide](./testing.md) - API testing strategies
- [Performance Guide](./performance.md) - API performance optimization

## References

- [OpenAPI Specification v3.0](https://swagger.io/specification/)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
