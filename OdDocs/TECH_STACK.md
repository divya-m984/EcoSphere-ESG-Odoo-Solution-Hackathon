# Technology Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime | Node.js | JavaScript runtime for the API. |
| Language | TypeScript 5 | Static typing and maintainable server code. |
| Framework | NestJS 10 | Modular HTTP application framework. |
| Frontend | React 18, Vite 5 | Single-page application and development tooling. |
| Component library | Material UI 5, Emotion | Accessible component primitives and application theme. |
| Client routing | React Router 6 | Public and protected browser routes. |
| HTTP client | Axios | Configured API client with bearer-token interceptor. |
| Forms | React Hook Form | Intended form state and validation integration. |
| Database | PostgreSQL | Relational ESG data persistence. |
| ORM | Prisma 5 | Schema, migrations, generated client, and database access. |
| Validation | `class-validator`, `class-transformer` | DTO validation and transformation. |
| Authentication | Passport, JWT | Intended bearer-token foundation. |
| API documentation | Swagger / OpenAPI | Interactive contract at `/docs`. |
| Testing | Jest, Supertest | Unit and HTTP integration testing. |
| Quality | ESLint, Prettier | Static analysis and formatting. |

EcoSphere has a React/Vite frontend and a modular NestJS REST API. PostgreSQL is accessed through Prisma. Backend configuration is loaded from `.env`; the API prefix defaults to `api`. The Vite frontend reads public build-time variables from `frontend/.env`.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | None | PostgreSQL connection URL. |
| `JWT_SECRET` | When auth is implemented | None | Access-token signing secret. |
| `PORT` | No | `3000` | HTTP listener port. |
| `API_PREFIX` | No | `api` | Prefix before API routes. |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin; use trusted origins outside development. |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000/api` | API base URL used by Axios. For the local NestJS default, set it to `http://localhost:3000/api`. |

Never commit `.env` files or production credentials.
