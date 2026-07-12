# EcoSphere ESG Management Platform — Backend

Backend foundation for the **EcoSphere ESG (Environmental, Social, and Governance) Management Platform**, built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

This repository currently contains the **backend foundation only**: project structure, database schema, configuration, and module scaffolding. No business logic has been implemented yet.

## Tech Stack

- [NestJS](https://nestjs.com/) + TypeScript
- PostgreSQL
- [Prisma ORM](https://www.prisma.io/)
- JWT authentication (`@nestjs/jwt`, `passport-jwt`) — scaffolded, not implemented
- Swagger / OpenAPI (`@nestjs/swagger`)
- ESLint + Prettier

## Project Structure

```
prisma/
  schema.prisma          # Prisma schema
  schema.sql              # Raw PostgreSQL DDL

src/
  common/
    filters/               # Global exception filter
    middleware/              # Request logger middleware
  config/
  prisma/                    # PrismaService / PrismaModule (global)
  health/                      # Health check endpoint
  auth/                         # Auth module scaffold (controller, service, module, dto)
  users/                          # Users module scaffold
  departments/                     # Departments module scaffold
  dashboard/                         # Dashboard module scaffold
  app.module.ts
  main.ts

.env.example
docs/DATABASE.md            # Full ER diagram, relationship & index documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
npm install
cp .env.example .env
# edit .env with your local DATABASE_URL, JWT_SECRET, etc.

npx prisma generate
npx prisma migrate dev --name init
```

### Run

```bash
npm run start:dev
```

- API base URL: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`
- Swagger docs: `http://localhost:3000/docs`

### Other scripts

```bash
npm run build       # compile to dist/
npm run lint        # eslint --fix
npm run format      # prettier --write
npm run test        # jest unit tests
npm run test:e2e    # jest e2e tests
```

## Database

See [`docs/DATABASE.md`](docs/DATABASE.md) for the full data model (29 entities covering users, departments, employees, carbon accounting, CSR/gamification, compliance, and notifications), ER diagram, relationship documentation, and index recommendations. The Prisma schema lives in `prisma/schema.prisma`; the raw DDL is in `prisma/schema.sql`.

## Status

This is foundation-only scaffolding: standard NestJS structure, Prisma/PostgreSQL wiring, global validation/exception handling, Swagger, request logging, a health check endpoint, and empty `Auth`, `Users`, `Departments`, and `Dashboard` modules. Business logic, authentication flows, and feature endpoints are intentionally not implemented here.
