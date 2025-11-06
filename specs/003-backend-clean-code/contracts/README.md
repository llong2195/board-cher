# API Contracts

**Feature**: 003-backend-clean-code  
**Date**: 2025-11-06

## Overview

This directory contains API contract documentation and validation schemas. The refactoring effort maintains **backward compatibility** - no breaking changes to API contracts.

---

## OpenAPI Documentation

**Purpose**: Validate that refactoring maintains API contract compatibility

### Baseline Generation

To generate the OpenAPI baseline before refactoring:

```bash
# Start backend server
cd packages/backend
pnpm dev

# Wait for server to start, then export OpenAPI spec
curl http://localhost:3000/api/docs-json > ../../../specs/003-backend-clean-code/contracts/openapi-baseline.json

# Or access Swagger UI
open http://localhost:3000/api/docs
```

### Contract Validation

After refactoring changes:

```bash
# Generate new OpenAPI spec
curl http://localhost:3000/api/docs-json > ../../../specs/003-backend-clean-code/contracts/openapi-refactored.json

# Compare for breaking changes
diff openapi-baseline.json openapi-refactored.json

# Expected result: Only documentation improvements, no structural changes
```

---

## API Contract Guarantees

### What MUST NOT Change

✅ **Endpoint URLs**: All existing routes remain unchanged  
✅ **HTTP Methods**: GET, POST, PUT, PATCH, DELETE preserved  
✅ **Request Schemas**: Required fields, types, validation rules  
✅ **Response Schemas**: Field names, types, structure  
✅ **HTTP Status Codes**: 200, 201, 400, 401, 403, 404, 409, 500  
✅ **Authentication**: JWT-based auth mechanism  
✅ **WebSocket Events**: Event names and payload structures

### What MAY Change

🔄 **API Documentation**: Improved descriptions, examples  
🔄 **Error Messages**: More detailed, user-friendly messages  
🔄 **Response Times**: Should improve with optimization  
🔄 **Internal Implementation**: Service logic, query patterns  
🔄 **Code Organization**: File structure, naming

---

## Contract Testing Strategy

### 1. Swagger/OpenAPI Generation

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Trello Vibe API')
  .setDescription('Kanban board management API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### 2. Request/Response DTOs

All endpoints use typed DTOs:

```typescript
// Request DTO
export class CreateBoardDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @ApiProperty({ description: 'Board title', example: 'Project Roadmap' })
  title: string;

  @IsEnum(BoardVisibility)
  @ApiProperty({ enum: BoardVisibility })
  visibility: BoardVisibility;
}

// Response DTO
export class BoardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: BoardVisibility })
  visibility: BoardVisibility;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}
```

### 3. Integration Tests

Contract validation through integration tests:

```typescript
describe('Board API (contract)', () => {
  it('POST /boards should match contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/boards')
      .send({
        title: 'Test Board',
        visibility: 'private',
      })
      .expect(201);

    // Validate response structure
    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Test Board',
      visibility: 'private',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Ensure no sensitive fields exposed
    expect(response.body).not.toHaveProperty('deletedAt');
  });

  it('GET /boards/:id should return 404 for non-existent board', async () => {
    const response = await request(app.getHttpServer()).get('/boards/non-existent-id').expect(404);

    // Validate error response structure
    expect(response.body).toMatchObject({
      statusCode: 404,
      errorCode: expect.any(String),
      message: expect.any(String),
      timestamp: expect.any(String),
    });
  });
});
```

---

## WebSocket Contracts

### Event Schemas

```typescript
// Client → Server events
interface JoinBoardEvent {
  boardId: string;
}

interface MovedCardEvent {
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
}

// Server → Client events
interface CardMovedEvent {
  cardId: string;
  listId: string;
  position: number;
  movedBy: string;
  timestamp: string;
}

interface BoardUpdatedEvent {
  boardId: string;
  changes: Partial<Board>;
  updatedBy: string;
  timestamp: string;
}
```

### WebSocket Contract Test

```typescript
describe('WebSocket (contract)', () => {
  it('should emit card-moved event when card is moved', (done) => {
    const client = io('http://localhost:3000');

    client.emit('join-board', { boardId: 'board-1' });

    client.on('card-moved', (event: CardMovedEvent) => {
      expect(event).toMatchObject({
        cardId: expect.any(String),
        listId: expect.any(String),
        position: expect.any(Number),
        movedBy: expect.any(String),
        timestamp: expect.any(String),
      });
      done();
    });

    // Trigger card move
    client.emit('move-card', {
      cardId: 'card-1',
      targetListId: 'list-2',
      position: 0,
    });
  });
});
```

---

## Error Response Contract

Standard error response format:

```typescript
interface ErrorResponse {
  statusCode: number; // HTTP status code
  errorCode: string; // Machine-readable error code
  message: string; // User-friendly message
  errors?: FieldError[]; // Validation errors (for 400)
  timestamp: string; // ISO 8601 timestamp
  requestId?: string; // For support tracking
}

interface FieldError {
  field: string; // Field name
  message: string; // Error message
  value?: any; // Submitted value (if safe to expose)
}
```

**Example Responses**:

```json
// 400 Validation Error
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "title must be longer than or equal to 3 characters",
      "value": "AB"
    }
  ],
  "timestamp": "2025-11-06T12:00:00.000Z"
}

// 404 Not Found
{
  "statusCode": 404,
  "errorCode": "BOARD_NOT_FOUND",
  "message": "Board with ID 'abc-123' not found",
  "timestamp": "2025-11-06T12:00:00.000Z",
  "requestId": "req-xyz-789"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred. Please try again later.",
  "timestamp": "2025-11-06T12:00:00.000Z",
  "requestId": "req-xyz-789"
}
```

---

## Validation Checklist

Before considering refactoring complete, verify:

- [ ] All existing endpoints return same response structure
- [ ] HTTP status codes unchanged for same scenarios
- [ ] Request validation rules remain consistent
- [ ] Error response format standardized across all endpoints
- [ ] OpenAPI spec generated successfully
- [ ] Integration tests pass without changes
- [ ] WebSocket events maintain payload structure
- [ ] No sensitive data exposed in responses
- [ ] Authentication/authorization behavior unchanged
- [ ] Performance meets or exceeds baseline (p95 <200ms)

---

## Contract Evolution

For future API changes (after this refactoring):

**Breaking Changes** (require major version bump):

- Removing endpoints
- Renaming fields
- Changing field types
- Making optional fields required
- Changing HTTP methods

**Non-Breaking Changes** (safe to deploy):

- Adding new endpoints
- Adding optional fields to requests
- Adding fields to responses
- Improving error messages
- Adding new HTTP status codes
- Performance improvements

---

## Summary

**Current Status**: Contracts directory created, baseline generation documented  
**Next Step**: Generate `openapi-baseline.json` when backend server is running  
**Validation**: Compare baseline vs. refactored OpenAPI specs for breaking changes  
**Goal**: Maintain 100% backward compatibility throughout refactoring effort
