# Quickstart Guide: Collaborative Kanban Board

**Feature**: 001-kanban-board  
**Date**: 2025-10-31  
**Prerequisites**: Node.js 20.x, pnpm 8.x, Docker (optional)

## Local Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd trello-vibe-coding

# Checkout feature branch
git checkout 001-kanban-board

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Create environment files:

**`packages/backend/.env`**:

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database - PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=trello
DATABASE_PASSWORD=trello
DATABASE_NAME=trello

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

**`packages/frontend/.env`**:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

### 3. Start Dependencies

**Option A: Using Docker Compose**

```bash
# Start Redis
docker-compose up -d redis
```

**Option B: Local Redis**

```bash
# Install and start Redis locally
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

### 4. Database Setup

```bash
# Generate and run migrations
cd packages/backend
pnpm typeorm migration:generate src/infrastructure/persistence/migrations/InitialSchema
pnpm typeorm migration:run

# Seed demo data
pnpm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd packages/backend
pnpm dev

# Terminal 2: Start frontend
cd packages/frontend
pnpm dev
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api/docs (Swagger)

---

## Quick Test Flow

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123",
    "name": "Alice Johnson"
  }'
```

**Response**:

```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }
}
```

### 2. Create Organization

```bash
TOKEN="<access_token from above>"

curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "description": "Our awesome company"
  }'
```

### 3. Create Board

```bash
ORG_ID="<org_id from above>"

curl -X POST http://localhost:3000/api/v1/boards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "'$ORG_ID'",
    "name": "Marketing Campaign Q1"
  }'
```

### 4. Create Lists

```bash
BOARD_ID="<board_id from above>"

# Create "Backlog" list
curl -X POST http://localhost:3000/api/v1/boards/$BOARD_ID/lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Backlog"}'

# Create "In Progress" list
curl -X POST http://localhost:3000/api/v1/boards/$BOARD_ID/lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "In Progress"}'

# Create "Complete" list
curl -X POST http://localhost:3000/api/v1/boards/$BOARD_ID/lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Complete"}'
```

### 5. Create Card

```bash
LIST_ID="<list_id from above>"

curl -X POST http://localhost:3000/api/v1/lists/$LIST_ID/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design landing page"
  }'
```

### 6. Test Real-time (Browser Console)

```javascript
// Open browser console at http://localhost:5173
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer <access_token>' },
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('board:join', { boardId: '<board_id>' });
});

socket.on('card:created', (data) => {
  console.log('New card created:', data);
});
```

---

## Development Scripts

### Backend

```bash
cd packages/backend

# Development
pnpm dev                 # Start dev server with watch mode
pnpm build              # Build for production
pnpm start              # Start production server

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run tests with coverage
pnpm test:e2e           # Run E2E tests

# Database
pnpm typeorm migration:generate src/infrastructure/persistence/migrations/MigrationName
pnpm typeorm migration:run
pnpm typeorm migration:revert
pnpm run seed           # Seed demo data

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
pnpm type-check         # TypeScript check
```

### Frontend

```bash
cd packages/frontend

# Development
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm preview            # Preview production build

# Testing
pnpm test               # Run unit tests
pnpm test:ui            # Run tests with UI
pnpm test:e2e           # Run E2E tests with Playwright

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
pnpm type-check         # TypeScript check
```

### Root Workspace

```bash
# Install all dependencies
pnpm install

# Run backend and frontend concurrently
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format all code
pnpm format
```

---

## Project Structure Overview

```
trello-vibe-coding/
├── packages/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── domain/   # Domain layer (DDD)
│   │   │   ├── application/  # Application services
│   │   │   ├── infrastructure/  # Database, Redis, WebSocket
│   │   │   └── presentation/  # Controllers, DTOs
│   │   ├── test/
│   │   ├── migrations/
│   │   └── package.json
│   ├── frontend/         # React app
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/    # Route pages
│   │   │   ├── services/ # API clients
│   │   │   └── stores/   # State management
│   │   └── package.json
│   └── shared/           # Shared types
│       ├── src/types/
│       └── package.json
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Find process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Issues

```bash
# Reset database
cd packages/backend
rm dev.db
pnpm typeorm migration:run
pnpm run seed
```

### Redis Connection Errors

```bash
# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Start Redis
docker-compose up -d redis
# OR
redis-server
```

### TypeScript Errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### WebSocket Connection Failed

- Check CORS configuration in backend
- Verify `VITE_WS_URL` in frontend `.env`
- Check browser console for specific error

---

## Demo Data

After running `pnpm run seed`, you'll have:

**Users**:

- alice@example.com / password123
- bob@example.com / password123
- carol@example.com / password123

**Organization**: "Acme Corp"

- Alice (Owner)
- Bob (Admin)
- Carol (Member)

**Board**: "Marketing Campaign Q1"

- Lists: Backlog, In Progress, Complete
- Sample cards with labels, assignees, comments

---

## Testing Real-time Collaboration

1. Open two browser windows side-by-side
2. Login as Alice in window 1
3. Login as Bob in window 2
4. Navigate to same board in both windows
5. Create/move cards in window 1
6. Watch updates appear instantly in window 2

---

## Performance Testing

```bash
# Install k6
brew install k6  # macOS
# OR
curl -L https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz | tar xvz

# Run load test
k6 run load-test.js

# Target: 1000 req/s with <200ms p95 latency
```

---

## Next Steps

1. Review API documentation: http://localhost:3000/api/docs
2. Check WebSocket events: `specs/001-kanban-board/contracts/websocket-events.md`
3. Read data model: `specs/001-kanban-board/data-model.md`
4. Explore codebase structure
5. Run tests: `pnpm test`
6. Make your first contribution!

---

## Helpful Resources

- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **TypeORM Docs**: https://typeorm.io
- **Socket.io Docs**: https://socket.io/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Project Spec**: `specs/001-kanban-board/spec.md`
- **Implementation Plan**: `specs/001-kanban-board/plan.md`

---

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review project documentation
3. Open an issue on GitHub
4. Ask in team chat

Happy coding! 🚀
