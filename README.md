# EcoSphere ESG Management Platform

Full-stack platform for tracking **Environmental, Social, and Governance (ESG)** metrics, combined with an employee gamification layer (challenges, tasks, badges, rewards, leaderboard). Built with NestJS, PostgreSQL, Prisma, and a React/Vite frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Setup Requirements](#setup-requirements)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Seed and Demo Credentials](#seed-and-demo-credentials)
8. [Implemented Modules](#implemented-modules)
9. [API Reference](#api-reference)
10. [Reward Redemption Business Rules](#reward-redemption-business-rules)
11. [Frontend Routes](#frontend-routes)
12. [Build and Test Commands](#build-and-test-commands)
13. [Additional Documentation](#additional-documentation)
14. [Current Limitations](#current-limitations)
15. [Team Contribution Guidance](#team-contribution-guidance)

---

## Project Overview

EcoSphere gives ESG managers and employees a single platform to:

- Monitor carbon transactions, diversity metrics, and sustainability goals (data layer complete; reporting UI is a placeholder).
- Run CSR challenges, recurring tasks, and badge programmes with an XP economy.
- Let employees redeem earned XP for real rewards through an auditable, idempotent, stock-safe redemption flow.
- View department-level leaderboards drawn from live XP data.

The codebase consists of a **NestJS backend** (root directory) and a **React/Vite frontend** (`frontend/`). Both are independent npm workspaces.

---

## Technology Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 14+ |
| Authentication | passport-jwt, @nestjs/jwt |
| Password hashing | Node built-in `crypto.scryptSync` (no bcrypt) |
| Validation | class-validator + class-transformer |
| API docs | @nestjs/swagger (Swagger/OpenAPI) |
| Linting | ESLint + Prettier |
| Testing | Jest + Supertest |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| UI library | MUI 5 (Material UI) |
| Routing | React Router 6 |
| HTTP client | Axios |
| Forms | React Hook Form |

---

## Repository Structure

```
/                              ← NestJS backend root
├── src/
│   ├── app.module.ts          ← Root module (registers all feature modules)
│   ├── main.ts                ← Bootstrap (global prefix, CORS, pipes, Swagger)
│   ├── auth/                  ← JWT login, strategy, JwtAuthGuard, RolesGuard, @CurrentUser()
│   ├── challenges/            ← Challenges CRUD
│   ├── tasks/                 ← Tasks CRUD (backed by CSRActivity)
│   ├── badges/                ← Badges CRUD
│   ├── rewards/               ← Employee + admin rewards with atomic redemption
│   │   ├── rewards.controller.ts
│   │   ├── admin-rewards.controller.ts
│   │   ├── rewards.service.ts
│   │   └── dto/
│   ├── departments/           ← List departments; teams leaderboard view
│   ├── dashboard/             ← Scaffolded — no endpoints yet
│   ├── users/                 ← Scaffolded — no endpoints yet
│   ├── health/                ← GET /api/health
│   ├── prisma/                ← PrismaModule (global) + PrismaService
│   └── common/
│       ├── filters/           ← HttpExceptionFilter (global)
│       └── middleware/        ← LoggerMiddleware (global)
│
├── prisma/
│   ├── schema.prisma          ← 29-model Prisma schema
│   ├── schema.sql             ← Raw PostgreSQL DDL
│   ├── seed.ts                ← Dev seed script (users, rewards, XP)
│   └── migrations/
│       ├── 20260712071509_init/
│       └── 20260712140000_reward_redemption_idempotency/
│
├── docs/
│   └── DATABASE.md            ← Full ER diagram and relationship documentation
│
├── OdDocs/                    ← Team design documents
│   ├── API_SPECIFICATION.md
│   ├── DEVELOPMENT_GUIDELINES.md
│   ├── GIT_WORKFLOW.md
│   ├── MODULE_BREAKDOWN.md
│   ├── PROJECT_STRUCTURE.md
│   ├── ROADMAP.md
│   └── TECH_STACK.md
│
├── .env.example               ← Backend environment variable template
├── package.json
└── tsconfig.json

frontend/                      ← React/Vite SPA
├── src/
│   ├── layouts/
│   │   ├── MainLayout.tsx     ← Persistent sidebar + top bar
│   │   ├── LoginLayout.tsx
│   │   └── ProtectedLayout.tsx ← Auth guard wrapper
│   ├── pages/                 ← One file per route (see Frontend Routes)
│   ├── services/
│   │   ├── api.ts             ← Axios instance (reads JWT from localStorage)
│   │   └── rewards.service.ts ← All rewards API calls
│   ├── hooks/
│   │   ├── useAuth.tsx        ← Auth state + login/logout helpers
│   │   └── useSidebar.ts
│   ├── components/            ← Shared UI components
│   ├── types/
│   │   └── rewards.ts         ← TypeScript types for rewards API
│   ├── utils/
│   │   └── constants.ts       ← ROUTES, SIDEBAR_WIDTH, STORAGE_KEYS
│   ├── routes/index.tsx       ← React Router route tree
│   └── theme/                 ← MUI theme configuration
├── .env.example               ← Frontend environment variable template
├── vite.config.ts
└── package.json
```

---

## Setup Requirements

- Node.js 18+
- PostgreSQL 14+
- npm (package-lock.json in both root and `frontend/`)

---

## Database Setup

### 1. Create a PostgreSQL database

```sql
CREATE DATABASE ecosphere_esg;
```

### 2. Configure the backend `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Replace with your actual connection string
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/ecosphere_esg?schema=public"

JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:5173
```

### 3. Configure the frontend `.env`

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# Must match the backend PORT and API_PREFIX
VITE_API_BASE_URL=http://localhost:3000/api
```

> **Note:** The frontend `.env.example` ships with port `8000`. Change it to match your backend `PORT` (default `3000`).

### 4. Apply migrations and generate the Prisma client

```bash
# From the repo root
npm install
npx prisma generate
npx prisma migrate deploy
```

> Use `migrate deploy` for applying existing migrations. Use `migrate dev` only when creating new migrations during development.

---

## Running the Application

### Backend

```bash
# From repo root
npm run start:dev        # Development (watch mode)
npm run start:prod       # Production (requires npm run build first)
```

| Endpoint | URL |
|---|---|
| API base | `http://localhost:3000/api` |
| Health check | `http://localhost:3000/api/health` |
| Swagger docs | `http://localhost:3000/docs` |

### Frontend

```bash
cd frontend
npm install
npm run dev              # Vite dev server → http://localhost:5173
```

---

## Seed and Demo Credentials

Run the seed script to create users, a department, and sample rewards:

```bash
# From repo root
npx ts-node prisma/seed.ts
```

Or, if you add the Prisma seed config to `package.json`:

```bash
npx prisma db seed
```

### Demo accounts — development only

> These credentials exist in the dev seed only. Never use them in production or any shared environment.

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@ecosphere.dev` | `Admin@123` | Full admin access; no Employee record |
| ESG Manager | `manager@ecosphere.dev` | `Manager@123` | Can manage rewards and challenges |
| Employee | `employee@ecosphere.dev` | `Employee@123` | "Alex Green", seeded with **2 000 XP** |

The seed also creates five sample rewards (Eco Water Bottle, Plant-a-Tree Certificate, Extra Day Off, Sustainability Workshop Ticket, Charity Donation) and one `Engineering` department.

---

## Implemented Modules

### Backend

| Module | Status | Notes |
|---|---|---|
| **Auth** | ✅ Implemented | Login, JWT signing, `JwtAuthGuard`, `RolesGuard`, `@CurrentUser()` decorator |
| **Challenges** | ✅ Implemented | Full CRUD; soft delete; category auto-create |
| **Tasks** | ✅ Implemented | Full CRUD backed by `CSRActivity`; metadata stored as JSON in description |
| **Badges** | ✅ Implemented | Full CRUD; `unlockRule` stored as JSON |
| **Departments** | ✅ Implemented | List all departments; teams leaderboard view with XP aggregation |
| **Rewards (employee)** | ✅ Implemented | Catalogue, XP balance, redemption history, atomic redeem with idempotency |
| **Rewards (admin)** | ✅ Implemented | Create, update, status toggle, per-reward redemption list |
| **Health** | ✅ Implemented | `GET /api/health` |
| **Dashboard** | ⚠️ Scaffolded | Module registered; controller exists but has no endpoints |
| **Users** | ⚠️ Scaffolded | Module registered; controller exists but has no endpoints |

### Frontend

| Page / Feature | Status | Notes |
|---|---|---|
| Login | ✅ Implemented | JWT stored in `localStorage` as `ecosphere_user` |
| Dashboard | ✅ Page exists | Placeholder content |
| Gamification hub | ✅ Implemented | Navigates to all sub-sections |
| Challenges list + form | ✅ Implemented | Connected to `/api/challenges` |
| Tasks list + form | ✅ Implemented | Connected to `/api/tasks` |
| Badges | ✅ Implemented | Connected to `/api/badges` |
| Teams | ✅ Implemented | Connected to `/api/departments/teams` |
| Leaderboard | ✅ Implemented | Connected to live XP data |
| Rewards catalogue | ✅ Implemented | Employee view; confirm dialog with idempotency key |
| Admin rewards | ✅ Implemented | CRUD, status toggle, redemption viewer |
| Environmental | ⚠️ Placeholder | Page shell only; no backend data |
| Social | ⚠️ Placeholder | Page shell only; no backend data |
| Governance | ⚠️ Placeholder | Page shell only; no backend data |
| Reports | ⚠️ Placeholder | Page shell only |
| Administration | ⚠️ Placeholder | Page shell only |
| Profile / Settings | ⚠️ Placeholder | Page shells only |

---

## API Reference

All routes are prefixed with `/api`. Swagger UI is available at `http://localhost:3000/docs`.

### Authentication

```
POST   /api/auth/login                     → { token, user }
```

Body: `{ "email": "...", "password": "..." }`
Response includes a Bearer token and `{ id, email, name, role }`.

### Challenges

```
GET    /api/challenges                     → Challenge[]
GET    /api/challenges/:id                 → Challenge
POST   /api/challenges                     → Challenge
PUT    /api/challenges/:id                 → Challenge
DELETE /api/challenges/:id                 → Challenge (soft-deleted: active = false)
```

### Tasks

```
GET    /api/tasks                          → Task[]
GET    /api/tasks/:id                      → Task
POST   /api/tasks                          → Task
PUT    /api/tasks/:id                      → Task
DELETE /api/tasks/:id                      → Task (hard delete)
```

### Badges

```
GET    /api/badges                         → Badge[]
GET    /api/badges/:id                     → Badge
POST   /api/badges                         → Badge
PUT    /api/badges/:id                     → Badge
DELETE /api/badges/:id                     → Badge
```

### Departments / Teams

```
GET    /api/departments                    → Department[]
GET    /api/departments/teams              → Department[] with XP aggregation (teams leaderboard)
```

### Rewards — Employee (JWT required for balance/redemptions/redeem)

```
GET    /api/rewards                        → PaginatedRewards   (public)
GET    /api/rewards/:id                    → Reward             (public; 404 if Inactive)
GET    /api/rewards/balance                → { employeeId, balance }   🔒
GET    /api/rewards/redemptions/me         → RewardRedemption[]        🔒
POST   /api/rewards/:id/redeem             → RedeemResult              🔒
```

`POST /redeem` body (optional): `{ "idempotencyKey": "<uuid>" }`

### Rewards — Admin (JWT + role `Admin` or `ESG_Manager`)

```
GET    /api/admin/rewards                  → PaginatedRewards (all statuses)  🔒
POST   /api/admin/rewards                  → Reward                           🔒
PATCH  /api/admin/rewards/:id              → Reward (update details / restock)🔒
PATCH  /api/admin/rewards/:id/status       → Reward (Activate / Deactivate)   🔒
GET    /api/admin/rewards/:id/redemptions  → RewardRedemption[]               🔒
```

### Health

```
GET    /api/health                         → { status: "ok", ... }
```

---

## Reward Redemption Business Rules

1. **XP balance is ledger-based.** Balance = `SUM(xp_events.delta)` for the employee — there is no cached balance column.

2. **Redemption is atomic.** The entire flow runs inside a single `prisma.$transaction`:
   - Re-verify balance inside the transaction (authoritative).
   - Decrement `rewards.stock` with `WHERE stock > 0` — Prisma `P2025` is thrown if two requests race for the last unit.
   - Insert a `RewardRedemption` row.
   - Insert a negative `XPEvent` (`source = redemption`).
   - If `stock` reaches 0, set `status = Out_Of_Stock` in the same transaction.

3. **Idempotency.** The frontend generates one UUID (`crypto.randomUUID()`) per confirm-dialog session and sends it as `idempotencyKey`. The server:
   - Checks for an existing `RewardRedemption` with that key before entering the transaction.
   - If found and owned by the same employee, returns the cached result immediately (field `idempotent: true`).
   - If a concurrent duplicate races and hits the unique constraint (`P2002`), recovers the winning record and returns it.

4. **Status rules:**
   - Only rewards with `status = Active` and `stock > 0` can be redeemed.
   - `Out_Of_Stock` rewards return `409 Conflict`, not `404`.
   - `Inactive` rewards return `404` in the employee catalogue.
   - Restocking an `Out_Of_Stock` reward via admin PATCH automatically sets `status = Active`.

5. **Role enforcement.** Only users with a non-null `employeeId` in their JWT (i.e., users linked to an `Employee` record) can call employee-facing endpoints. Admin users without an Employee record will receive `403 Forbidden`.

---

## Frontend Routes

All routes below `/` require authentication. Unauthenticated requests are redirected to `/login`.

```
/login

/dashboard
/environmental
/social
/governance

/gamification
/gamification/challenges
/gamification/challenges/new
/gamification/challenges/:id
/gamification/tasks
/gamification/tasks/new
/gamification/tasks/:id
/gamification/badges
/gamification/teams
/gamification/rewards
/gamification/rewards/manage

/leaderboard
/reports
/administration
/profile
/settings
```

### Auth storage

The frontend stores the authenticated session in `localStorage` under the key `ecosphere_user`:

```json
{ "id": "...", "email": "...", "name": "...", "role": "Admin|ESG_Manager|Employee", "token": "<jwt>" }
```

The Axios instance in `frontend/src/services/api.ts` reads `user.token` and attaches it as `Authorization: Bearer <token>` on every request.

### Route constants

All route paths are exported from `frontend/src/utils/constants.ts` as `ROUTES.*`:

```ts
ROUTES.LEADERBOARD       // '/leaderboard'
ROUTES.REWARDS           // '/gamification/rewards'
ROUTES.ADMIN_REWARDS     // '/gamification/rewards/manage'
```

---

## Build and Test Commands

### Backend

```bash
npm run build          # Compile TypeScript → dist/
npm run start:prod     # Run compiled output
npm run lint           # ESLint --fix
npm run format         # Prettier --write
npm run test           # Jest unit tests
npm run test:cov       # Jest with coverage report
npm run test:e2e       # Jest e2e tests (jest-e2e.json config)

# Prisma helpers
npx prisma generate    # Regenerate client after schema changes
npx prisma migrate dev # Create and apply a new migration (dev only)
npx prisma studio      # Open Prisma Studio browser UI
```

### Frontend

```bash
cd frontend
npm run build          # tsc + vite build → frontend/dist/
npm run lint           # ESLint
npm run preview        # Serve the production build locally
```

---

## Additional Documentation

| File | Contents |
|---|---|
| `docs/DATABASE.md` | Full ER diagram (Mermaid), all 29 entities, relationship docs, index recommendations |
| `OdDocs/API_SPECIFICATION.md` | Planned API contract |
| `OdDocs/MODULE_BREAKDOWN.md` | Module ownership and responsibilities |
| `OdDocs/PROJECT_STRUCTURE.md` | Intended project layout |
| `OdDocs/TECH_STACK.md` | Technology decisions and rationale |
| `OdDocs/DEVELOPMENT_GUIDELINES.md` | Coding conventions |
| `OdDocs/GIT_WORKFLOW.md` | Branch strategy and PR process |
| `OdDocs/ROADMAP.md` | Planned features and phases |

The Prisma schema (`prisma/schema.prisma`) is the authoritative source for the data model. 29 entities cover users, departments, employees, carbon accounting, CSR activities, challenges, badges, rewards, compliance, audits, ESG policies, diversity metrics, sustainability goals, notifications, and scoring.

---

## Current Limitations

The following are known gaps between the data model and the live API/UI:

- **Dashboard module** has no endpoints. The dashboard frontend page shows placeholder content.
- **Users module** has no endpoints. User management (create, update, deactivate) is not exposed via API.
- **Environmental / Social / Governance pages** are page shells with no backend connection. The schema supports carbon transactions, diversity metrics, training records, and sustainability goals, but no API endpoints for these models exist yet.
- **Reports page** is a placeholder.
- **Administration / Profile / Settings pages** are placeholder shells.
- **CSR Activities** have a complete schema and `EmployeeParticipation` model but no API endpoints.
- **Compliance and Audit** entities (`Audit`, `ComplianceIssue`) exist in the schema but have no API.
- **ESGConfiguration** (singleton row for scoring weights) exists in the schema but has no API.
- **Notifications** (`Notification`, `NotificationSetting`) are modelled but not implemented.
- **DepartmentScore** computation is not triggered automatically. The table exists but no job or endpoint populates it.
- **No file/evidence upload.** `proofUrl` and `documentUrl` fields are `VARCHAR` only; no storage integration exists.
- **`Tasks` module** uses `CSRActivity` as its backing table and serialises extra metadata (cadence, participation, milestones) into the description field as JSON. This is an interim approach.

---

## Team Contribution Guidance

See `OdDocs/GIT_WORKFLOW.md` and `OdDocs/DEVELOPMENT_GUIDELINES.md` for the full branching strategy and coding conventions. Brief summary:

### Adding a new backend module

1. Generate with the NestJS CLI: `npx nest g module <name> && npx nest g controller <name> && npx nest g service <name>`
2. Import the new module in `src/app.module.ts`.
3. If a new Prisma model is needed, add it to `prisma/schema.prisma`, run `npx prisma migrate dev --name <description>`, then `npx prisma generate`.
4. Add guard decorators (`@UseGuards(JwtAuthGuard)`, `@Roles(...)`) to protected routes.
5. Annotate controllers with `@ApiTags` and operations with `@ApiOperation` for Swagger.

### Adding a new frontend page

1. Create the page component in `frontend/src/pages/`.
2. Add the path constant to `ROUTES` in `frontend/src/utils/constants.ts`.
3. Register the route in `frontend/src/routes/index.tsx`.
4. If the page needs sidebar navigation, add an entry to `controlNavItems` or `gamifyNavItems` in `frontend/src/layouts/MainLayout.tsx`.
5. Add API calls in `frontend/src/services/` following the pattern in `rewards.service.ts`.

### Environment variables

- Backend: copy `.env.example` → `.env`, never commit `.env`.
- Frontend: copy `frontend/.env.example` → `frontend/.env`, never commit `frontend/.env`.
- `JWT_SECRET` must be changed from the example value in any non-local environment.
