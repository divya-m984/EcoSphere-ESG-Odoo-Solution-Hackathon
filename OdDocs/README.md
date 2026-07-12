# EcoSphere ESG Management Platform

EcoSphere is a full-stack platform for measuring, managing, and improving an organisation's Environmental, Social, and Governance (ESG) performance. It provides a foundation for carbon accounting, employee engagement, policy governance, compliance monitoring, rewards, and decision-ready reporting.

> **Project status:** foundation. The NestJS backend data model, bootstrap, health check, and module scaffolding are in place. A React frontend shell provides protected navigation and placeholder ESG views. Most business endpoints and frontend data integration are still planned.

## Business Objectives

- Measure environmental impact through operation records, emission factors, and carbon transactions.
- Give ESG managers a shared view of organisational, departmental, and employee activity.
- Encourage CSR and sustainability participation through points, badges, and rewards.
- Strengthen governance with policies, acknowledgements, audits, and compliance issues.
- Provide reliable dashboard and report data for ESG decisions and disclosure preparation.

## Quick Start

### Prerequisites

- Node.js 18 or later (Node.js 20 recommended)
- npm
- PostgreSQL 14 or later

### Configure and run locally

1. Install dependencies: `npm install`
2. Create `.env` in the repository root:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecosphere?schema=public"
   JWT_SECRET="replace-with-a-long-random-development-secret"
   PORT=3000
   API_PREFIX=api
   CORS_ORIGIN=http://localhost:3000
   ```

3. Generate Prisma Client: `npm run prisma:generate`
4. Apply the initial migration: `npm run prisma:migrate -- --name init`
5. Start the API: `npm run start:dev`

The API runs at `http://localhost:3000/api`. The currently implemented health endpoint is `GET /api/health`; Swagger is at `http://localhost:3000/docs`.

### Run the frontend

The frontend is a separate Vite application in `frontend/`.

1. Install its dependencies: `npm install --prefix frontend`
2. Create `frontend/.env` from `frontend/.env.example` and set the backend address:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. Start the frontend: `npm run dev --prefix frontend`

Vite prints the local browser URL when it starts. The current frontend uses simulated authentication and placeholder data; its configured API client is ready for the backend endpoints described in [API_SPECIFICATION.md](API_SPECIFICATION.md).

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run with file watching. |
| `npm run build` | Compile to `dist/`. |
| `npm run lint` | Run ESLint with automatic fixes. |
| `npm run format` | Format TypeScript source and tests. |
| `npm run test` | Run unit tests. |
| `npm run test:e2e` | Run end-to-end tests. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run dev --prefix frontend` | Run the Vite frontend. |
| `npm run build --prefix frontend` | Type-check and build the frontend. |
| `npm run lint --prefix frontend` | Lint frontend TypeScript and TSX. |

## Documentation

- [Project structure](PROJECT_STRUCTURE.md)
- [Technology stack](TECH_STACK.md)
- [Development guidelines](DEVELOPMENT_GUIDELINES.md)
- [API specification](API_SPECIFICATION.md)
- [Module breakdown](MODULE_BREAKDOWN.md)
- [Git workflow](GIT_WORKFLOW.md)
- [Roadmap](ROADMAP.md)
- [Database architecture](../docs/DATABASE.md)

## License

This is a private, unlicensed project. Do not distribute it without permission from the project owners.
