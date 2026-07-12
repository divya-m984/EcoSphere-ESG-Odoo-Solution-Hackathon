# Project Structure

## Repository Layout

```text
.
├── prisma/
│   ├── schema.prisma       # Models, enums, indexes, and relations
│   └── schema.sql          # PostgreSQL DDL reference
├── docs/
│   └── DATABASE.md         # ER diagram and data design notes
├── OdDocs/                  # Project, API, workflow, and roadmap documentation
│   ├── README.md            # Project overview and local setup
│   └── API_SPECIFICATION.md # Draft REST API contract
├── frontend/                # React single-page application
│   ├── src/
│   │   ├── components/      # Shared visual components
│   │   ├── hooks/           # Authentication and UI state hooks
│   │   ├── layouts/         # Login, protected, and application layouts
│   │   ├── pages/           # ESG feature and account pages
│   │   ├── routes/          # React Router configuration and guards
│   │   ├── services/        # Configured Axios API client
│   │   ├── theme/           # Material UI theme
│   │   └── types/           # Shared frontend TypeScript types
│   ├── .env.example         # Vite public API base URL example
│   ├── package.json         # Frontend scripts and dependencies
│   └── vite.config.ts       # Vite and `@` source alias configuration
├── src/
│   ├── common/             # Global exception handling and request logging
│   ├── prisma/             # PrismaModule and PrismaService
│   ├── auth/               # Authentication scaffold
│   ├── users/              # User scaffold
│   ├── departments/        # Department scaffold
│   ├── dashboard/          # Dashboard scaffold
│   ├── health/             # Implemented health endpoint
│   ├── app.module.ts       # Root module composition
│   └── main.ts             # Bootstrap, CORS, validation, Swagger
├── package.json            # Scripts and dependencies
└── tsconfig*.json          # TypeScript configuration
```

## Application Conventions

Backend features belong in `src/<feature>/`. A complete module normally contains `dto/` for validated contracts, a controller for HTTP and Swagger decorators, a service for use cases and Prisma access, a module for dependency composition, and focused tests. Frontend features are organised by role in `frontend/src/`: pages compose the interface, layouts own shared chrome and route outlets, and services own HTTP clients.

Controllers authenticate, validate, authorize, and delegate. Services own business logic. Shared transport and cross-cutting behaviour belongs in `src/common/`.

## Existing Runtime Behaviour

`main.ts` applies the configurable `api` global prefix, CORS, validation with whitelisting and implicit transformation, an HTTP exception filter, and Swagger. `PrismaModule` provides database access. `HealthModule` is the only module with a working route. The frontend mounts Material UI, an auth provider, and React Router; it protects application routes but currently uses mock local-storage authentication. `prisma/schema.prisma` is the implementation source of truth; see [DATABASE.md](../docs/DATABASE.md) for its relationships and indexes.
