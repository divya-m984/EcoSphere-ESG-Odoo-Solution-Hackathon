# Development Guidelines

## Local Development

Install backend dependencies with `npm install`, frontend dependencies with `npm install --prefix frontend`, and configure the environments in [README.md](README.md). Run `npm run prisma:generate` and `npm run start:dev` for the backend, and `npm run dev --prefix frontend` for the user interface. Before a pull request, run the relevant backend and frontend build and lint commands.

For schema changes, edit `prisma/schema.prisma`, create a named migration with `npm run prisma:migrate -- --name <description>`, regenerate Prisma Client, and update the related documentation. Do not manually alter generated Prisma Client files.

## TypeScript and NestJS Standards

- Use strong TypeScript types; avoid `any` unless required by an external interface.
- Follow Prettier: two spaces, single quotes, trailing commas, and 100-character line width.
- Keep controllers transport-focused; place business rules in services.
- Use DTO classes and `class-validator` rules for request bodies, params, and queries.
- Use NestJS HTTP exceptions instead of manually composed HTTP responses.
- Use dependency injection; feature code must not instantiate Prisma clients directly.
- Add Swagger decorators to public endpoints and DTOs.
- Keep frontend pages focused on composition; move reusable visual elements to `frontend/src/components/` and server communication to `frontend/src/services/`.
- Use the `@` import alias for modules under `frontend/src/`, matching the existing Vite configuration.
- Keep client-side route protection as a user-experience layer; the backend remains the authority for authorization.

## Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Files | feature name with Nest suffix | `carbon-transactions.service.ts` |
| Classes | PascalCase | `CarbonTransactionsService` |
| Methods and variables | camelCase | `findByDepartment` |
| DTOs | Verb + resource + `Dto` | `CreateDepartmentDto` |
| Database tables/columns | snake_case via Prisma mapping | `carbon_transactions` |
| API paths | lowercase plural kebab-case | `/carbon-transactions` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |

## Quality, Security, and Data

Write service tests for rules and controller or end-to-end tests for route contracts, role boundaries, and validation failures. Add frontend tests when UI behaviour becomes non-trivial, especially authentication transitions, route guards, and API error states. Never expose password hashes, secrets, or connection strings. Vite variables are bundled into client code, so only expose non-sensitive values prefixed `VITE_`. Enforce roles in guards, scope employee records to the authenticated employee where required, and preserve factor-value snapshots so historical emissions remain auditable. Prefer soft deactivation where the schema provides an `active` field.
