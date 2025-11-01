# Trello Vibe - Collaborative Kanban Board

A modern, real-time collaborative kanban board application inspired by Trello. Built with a focus on user experience, code quality, and scalability.

## 🚀 Features

- **Real-time Collaboration**: See changes instantly as team members work together
- **Intuitive Board Management**: Create boards, lists, and cards with drag-and-drop
- **Rich Card Details**: Add descriptions, due dates, attachments, checklists, labels, and comments
- **Team Organization**: Manage teams with role-based access control (owner/admin/member/guest)
- **Search & Filter**: Quickly find cards across large boards
- **Activity History**: Complete audit trail of all changes
- **Card Assignment**: Assign tasks to team members with notifications

## 🏗️ Architecture

### Tech Stack

- **Backend**: NestJS 10.x with TypeScript 5.3+, Node.js 20.x LTS
- **Frontend**: React 18.x with TypeScript, Vite, shadcn/ui
- **Database**: PostgreSQL 15+
- **Caching**: Redis 7+ with ioredis
- **Real-time**: Socket.io 4.x with Redis adapter
- **ORM**: TypeORM 0.3.x with migrations
- **Package Manager**: pnpm workspaces (monorepo)

### Architecture Pattern

- **Domain-Driven Design (DDD)** with layered architecture
- **CQRS** (Command Query Responsibility Segregation)
- **Event-Driven** architecture for real-time updates
- **Repository Pattern** for data access
- **Horizontal Scaling** via stateless API and Redis pub/sub

### Project Structure

```
trello-vibe-coding/
├── packages/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── domain/         # Domain models & business logic
│   │   │   ├── application/    # Use cases (commands/queries)
│   │   │   ├── infrastructure/ # External services (DB, cache, WebSocket)
│   │   │   └── presentation/   # Controllers, DTOs, filters
│   │   ├── migrations/         # Database migrations
│   │   └── test/              # Tests (unit, integration, e2e)
│   ├── frontend/         # React + Vite app
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Route pages
│   │   │   ├── services/      # API clients
│   │   │   ├── stores/        # State management
│   │   │   └── hooks/         # Custom React hooks
│   │   └── test/             # Component & integration tests
│   └── shared/           # Shared types & validators
│       └── src/
│           ├── types/         # TypeScript types
│           ├── constants/     # Shared constants
│           └── validators/    # Validation schemas
├── docker-compose.yml    # Local development environment
├── pnpm-workspace.yaml   # Monorepo configuration
└── specs/                # Feature specifications
    └── 001-kanban-board/ # Current feature implementation
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 20.x LTS or higher
- **pnpm** 8.0.0 or higher
- **Docker** & Docker Compose (for PostgreSQL & Redis)
- **Git**

### Quick Start

1. **Clone the repository**

```bash
git clone <repository-url>
cd trello-vibe-coding
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start infrastructure services**

```bash
docker-compose up -d postgres redis
```

4. **Setup environment variables**

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
```

5. **Run database migrations**

```bash
cd packages/backend
pnpm run migration:run
```

6. **Start development servers**

```bash
# From root - starts all packages in parallel
pnpm dev

# Or individually:
# Backend: http://localhost:3000
cd packages/backend && pnpm run start:dev

# Frontend: http://localhost:5173
cd packages/frontend && pnpm run dev
```

## 📝 Available Scripts

### Root (Monorepo)

- `pnpm dev` - Start all packages in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

### Backend

- `pnpm run start:dev` - Start in development mode with hot reload
- `pnpm run build` - Build for production
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run migration:generate` - Generate new migration
- `pnpm run migration:run` - Run pending migrations

### Frontend

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run component tests

## 🧪 Testing

The project follows **Test-Driven Development (TDD)** practices with comprehensive test coverage:

- **Unit Tests**: Domain models, services, utilities
- **Integration Tests**: Repository implementations, API endpoints
- **E2E Tests**: Complete user journeys with Playwright
- **Coverage Target**: ≥80% overall, ≥90% for critical paths

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific package tests
cd packages/backend && pnpm test
cd packages/frontend && pnpm test
```

## 🚢 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start with Docker Compose
docker-compose up -d
```

### Environment Variables

See `.env.example` files in each package for required configuration:

- **Backend**: Database, Redis, JWT secrets, file storage
- **Frontend**: API URLs, WebSocket endpoints

## 📊 Performance Targets

- **API Response Time**: <200ms (p95)
- **Page Load**: <3s (initial load)
- **Real-time Updates**: <1s (delivery latency)
- **Throughput**: 1000 req/s sustained
- **Concurrent Users**: 100+ per board

## 🔒 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- Role-based access control (RBAC)
- Input validation with class-validator
- Rate limiting (100 req/min per user)
- CORS configuration
- Helmet.js security headers
- SQL injection prevention via parameterized queries

## 📖 Documentation

- **API Documentation**: Available at `/api/docs` (Swagger UI) when backend is running
- **Feature Specifications**: See `specs/001-kanban-board/` directory
- **Architecture Decisions**: See `specs/001-kanban-board/research.md`
- **Data Model**: See `specs/001-kanban-board/data-model.md`

## 🤝 Contributing

1. Follow the **Constitution** principles in `.specify/memory/constitution.md`
2. Write tests first (TDD)
3. Maintain ≥80% code coverage
4. Follow TypeScript strict mode
5. Use ESLint + Prettier (pre-commit hooks enforced)
6. Keep cyclomatic complexity ≤10

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Real-time powered by [Socket.io](https://socket.io/)
