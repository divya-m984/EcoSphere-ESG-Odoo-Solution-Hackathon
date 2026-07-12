# API Specification

## Status and Conventions

This is the initial REST API contract. Except `GET /health`, the routes below are **draft endpoints** and are not implemented in the current backend codebase. The intended base URL is `/api`; Swagger is available at `/docs` when the API runs. The React frontend has a configured Axios client but currently renders placeholder data rather than calling these routes.

All requests and responses use JSON. Fields use `camelCase`; resource identifiers are UUIDs; timestamps use ISO 8601 UTC; dates use `YYYY-MM-DD`. List routes accept `page` (default `1`) and `limit` (default `20`, maximum `100`) and return:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

Successful creation returns `201`; retrieval and updates return `200`; deletion/deactivation returns `204`. Validation errors return `400`, missing resources `404`, duplicate unique values `409`, and insufficient permissions `403`.

## Authentication and Authorisation

The intended authentication mechanism is a JWT bearer token. JWT packages are installed but login, guards, and token issuance are not yet implemented. The frontend's current local-storage mock login is for interface scaffolding only and is not an authentication mechanism.

```http
Authorization: Bearer <access-token>
```

Proposed roles are `Admin`, `ESG_Manager`, and `Employee`. Administrative reference data and governance actions require `Admin` or `ESG_Manager`; employee actions must be scoped to their own employee record unless elevated permission is granted. Password hashes are never returned.

Draft authentication routes:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Exchange email and password for an access token. |
| `POST` | `/auth/refresh` | Rotate an access token using a refresh token. |
| `GET` | `/auth/me` | Return the authenticated user and employee profile. |

```json
// POST /api/auth/login
{ "email": "manager@ecosphere.example", "password": "example-password" }

// 200 response
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "id": "uuid", "email": "manager@ecosphere.example", "role": "ESG_Manager" }
}
```

## Core Resource Endpoints

All listed `GET` collection routes support pagination. `PATCH` accepts the mutable fields from the matching create request. `DELETE` should deactivate records that carry an `active` field rather than erase audit-relevant data.

| Resource | Endpoints | Access |
| --- | --- | --- |
| Departments | `GET, POST /departments`; `GET, PATCH, DELETE /departments/:id` | Read: authenticated. Write: Admin, ESG Manager. |
| Employees | `GET, POST /employees`; `GET, PATCH, DELETE /employees/:id` | Admin, ESG Manager; employees may read/update permitted self fields. |
| Carbon Transactions | `GET, POST /carbon-transactions`; `GET, PATCH, DELETE /carbon-transactions/:id` | Admin, ESG Manager. |
| Emission Factors | `GET, POST /emission-factors`; `GET, PATCH, DELETE /emission-factors/:id` | Read: authenticated. Write: Admin, ESG Manager. |
| CSR Activities | `GET, POST /csr-activities`; `GET, PATCH, DELETE /csr-activities/:id` | Read: authenticated. Write: Admin, ESG Manager. |
| Challenges | `GET, POST /challenges`; `GET, PATCH, DELETE /challenges/:id` | Read: authenticated. Write: Admin, ESG Manager. |
| Policy Acknowledgements | `GET /policy-acknowledgements`; `POST /policy-acknowledgements`; `GET /policy-acknowledgements/:id` | Employee owns acknowledgement; managers can review. |
| Audits | `GET, POST /audits`; `GET, PATCH, DELETE /audits/:id` | Admin, ESG Manager. |
| Compliance Issues | `GET, POST /compliance-issues`; `GET, PATCH /compliance-issues/:id` | Admin, ESG Manager; owner may update permitted resolution fields. |
| Rewards | `GET, POST /rewards`; `GET, PATCH, DELETE /rewards/:id`; `POST /rewards/:id/redemptions` | Catalogue read: authenticated. Management: Admin, ESG Manager. Redemption: Employee. |
| Reports | `GET /reports/emissions`; `GET /reports/esg-score`; `GET /reports/compliance` | Admin, ESG Manager. |
| Dashboard | `GET /dashboard/summary`; `GET /dashboard/departments/:id` | Authenticated; enforce role/data scope. |

## Request and Response Examples

### Departments

```json
// POST /api/departments
{ "name": "Operations", "code": "OPS", "countryCode": "IN", "parentDepartmentId": null }

// 201 response
{
  "id": "7a111111-1111-4111-8111-111111111111",
  "name": "Operations", "code": "OPS", "countryCode": "IN",
  "headId": null, "employeeCount": 0, "active": true,
  "createdAt": "2026-07-12T10:00:00.000Z", "updatedAt": "2026-07-12T10:00:00.000Z"
}
```

`GET /departments` may filter by `active`, `parentDepartmentId`, or `countryCode`. Department code is unique. A department head must be an employee.

### Employees

```json
// POST /api/employees
{
  "userId": "e1111111-1111-4111-8111-111111111111",
  "name": "Asha Nair",
  "departmentId": "7a111111-1111-4111-8111-111111111111",
  "gender": "Female",
  "hireDate": "2024-05-20"
}

// 201 response
{ "id": "f1111111-1111-4111-8111-111111111111", "name": "Asha Nair", "departmentId": "7a1111111-1111-4111-8111-111111111111", "active": true }
```

An employee has one unique user identity and belongs to one department.

### Emission Factors and Carbon Transactions

```json
// POST /api/emission-factors
{
  "activityType": "Electricity",
  "unit": "kWh",
  "region": "IN",
  "factorValue": 0.708,
  "source": "EPA",
  "validYear": 2026,
  "referenceUrl": "https://example.org/factors"
}

// POST /api/carbon-transactions
{
  "emissionFactorId": "a1111111-1111-4111-8111-111111111111",
  "departmentId": "7a111111-1111-4111-8111-111111111111",
  "quantity": 1250,
  "unit": "kWh",
  "txnDate": "2026-07-01",
  "operationRecordId": null
}

// 201 response
{
  "id": "b1111111-1111-4111-8111-111111111111",
  "emissionFactorId": "a1111111-1111-4111-8111-111111111111",
  "factorValueSnapshot": 0.708,
  "quantity": 1250, "unit": "kWh",
  "calculatedEmission": 885, "departmentId": "7a111111-1111-4111-8111-111111111111",
  "txnDate": "2026-07-01", "autoCalculated": true
}
```

The service calculates `calculatedEmission` from quantity and the emission factor, then persists `factorValueSnapshot`. Do not accept a client-calculated value as authoritative. Factor uniqueness is `activityType + region + unit + validYear`.

### CSR Activities and Challenges

```json
// POST /api/csr-activities
{
  "title": "Community tree planting", "categoryId": "uuid",
  "description": "Volunteer planting event", "activityDate": "2026-08-15",
  "pointsValue": 100, "evidenceRequired": true
}

// POST /api/challenges
{
  "title": "Low-carbon commute week", "categoryId": "uuid",
  "description": "Use a lower-emission commute for five working days.",
  "xpReward": 250, "difficulty": "Medium", "evidenceRequired": true,
  "deadline": "2026-09-30", "status": "Active"
}
```

Draft participation routes are `POST /csr-activities/:id/participations` and `POST /challenges/:id/participations`, with `proofUrl` where evidence is required. Approval status is `Pending`, `Approved`, or `Rejected`; only approval should award activity points or challenge XP.

### Policy Acknowledgements

```json
// POST /api/policy-acknowledgements
{ "policyId": "c1111111-1111-4111-8111-111111111111" }

// 201 response
{
  "id": "d1111111-1111-4111-8111-111111111111",
  "policyId": "c1111111-1111-4111-8111-111111111111",
  "employeeId": "f1111111-1111-4111-8111-111111111111",
  "acknowledgedAt": "2026-07-12T10:30:00.000Z"
}
```

The employee identity must come from the token, not a request-supplied employee ID. Only published policies can be acknowledged. Each employee-policy pair is unique.

### Audits and Compliance Issues

```json
// POST /api/audits
{ "scope": "FY2026 environmental data controls", "auditorId": "uuid", "auditDate": "2026-10-15", "status": "Planned" }

// POST /api/compliance-issues
{
  "auditId": "uuid", "severity": "High", "description": "Missing electricity invoices for June.",
  "ownerId": "uuid", "dueDate": "2026-10-31"
}

// PATCH /api/compliance-issues/:id
{ "status": "Resolved" }
```

Audit status is `Planned`, `In_Progress`, or `Completed`; compliance severity is `Low`, `Medium`, `High`, or `Critical`; issue status is `Open` or `Resolved`.

### Rewards

```json
// POST /api/rewards
{ "name": "Reusable bottle", "description": "Stainless steel bottle", "pointsRequired": 500, "stock": 50, "status": "Active" }

// POST /api/rewards/:id/redemptions
{ "employeeId": "f1111111-1111-4111-8111-111111111111" }

// 201 response
{ "id": "uuid", "rewardId": "uuid", "employeeId": "uuid", "pointsDeducted": 500, "redeemedAt": "2026-07-12T11:00:00.000Z" }
```

For employee-initiated redemptions, `employeeId` must be derived from the token. Redemption must be transactional: verify active stock and point balance, create the redemption and XP event, then decrement stock.

### Reports and Dashboard

```http
GET /api/reports/emissions?from=2026-01-01&to=2026-06-30&departmentId=uuid&groupBy=month
GET /api/dashboard/summary?from=2026-01-01&to=2026-06-30
```

```json
// GET /api/dashboard/summary response
{
  "period": { "from": "2026-01-01", "to": "2026-06-30" },
  "emissions": { "total": 12842.4, "unit": "kgCO2e", "changePercent": -8.2 },
  "engagement": { "activeChallenges": 4, "approvedParticipations": 86 },
  "governance": { "openComplianceIssues": 3, "overdueComplianceIssues": 1 },
  "scores": { "environmental": 72.5, "social": 68.0, "governance": 81.0, "total": 73.7 }
}
```

Reports must state their period, filters, aggregation basis, unit, and generation timestamp. `GET /reports/esg-score` should return department score history; `GET /reports/compliance` should return findings grouped by status, severity, owner, and due-date condition.

## Frontend Integration Contract

The frontend Axios instance reads `VITE_API_BASE_URL`; configure it as `http://localhost:3000/api` for the current NestJS default. On authentication implementation, replace the mock `useAuth` login with `POST /auth/login`, retain tokens only according to the approved security design, and have the Axios interceptor attach the access token. A `401` response should clear invalid authentication state and redirect the user to `/login`.

## Implemented Endpoint

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Checks API and database health. |

The exact health response is governed by `HealthService` and should be covered by an integration test as the implementation evolves.
