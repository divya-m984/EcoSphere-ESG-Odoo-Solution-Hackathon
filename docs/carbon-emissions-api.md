# Carbon Emissions API — Frontend Handoff

Backend-only pass implementing the Carbon Emissions BRD (employee commuting + company
invoice emissions, emission factors, dashboard, reports). All routes are under the
global `api` prefix and documented in Swagger at `/docs`. This file is a quick-reference
companion to Swagger, not a replacement for it.

Auth: every route below requires `Authorization: Bearer <token>` from `POST /api/auth/login`.
Admin-only routes additionally require `role` of `Admin` or `ESG_Manager` (else `403`).

## Employees — commute profile

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/employees/me/commute-profile` | any | 404 if not set yet |
| PUT | `/api/employees/me/commute-profile` | any | body: `{ transportMode, distanceKm, roundTrip? }` |
| GET | `/api/admin/employees/:employeeId/commute-profile` | Admin/ESG_Manager | |
| PUT | `/api/admin/employees/:employeeId/commute-profile` | Admin/ESG_Manager | admin correction |

`transportMode` enum: `Car_Petrol, Car_Diesel, Car_Electric, Motorcycle, Bus, Train, Bicycle, Walk, Carpool`.

## Attendance

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| POST | `/api/attendance/me` | any | body: `{ date, status?, transportModeOverride? }`, upserts on date, triggers recalculation |
| GET | `/api/attendance/me` | any | query: `year?, month?, page?, limit?` |
| GET | `/api/admin/attendance` | Admin/ESG_Manager | query: `employeeId?, departmentId?, status?, year?, month?, page?, limit?` |
| PATCH | `/api/admin/attendance/:id` | Admin/ESG_Manager | correct a record |
| POST | `/api/admin/attendance/bulk` | Admin/ESG_Manager | body: `{ employeeIds[], date, status }` |

`status` enum: `Present, WFH, Leave, Holiday`. Only `Present` days count toward commute distance/emission.
Future dates are rejected (`400`).

## Emission Factors (admin reference data)

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/admin/emission-factors` | Admin/ESG_Manager |
| GET | `/api/admin/emission-factors/:id` | Admin/ESG_Manager |
| POST | `/api/admin/emission-factors` | Admin/ESG_Manager |
| PATCH | `/api/admin/emission-factors/:id` | Admin/ESG_Manager |
| DELETE | `/api/admin/emission-factors/:id` | Admin/ESG_Manager (soft delete) |

`source` enum: `EPA, Ember, IPCC, DEFRA, Custom`. Lookup key is `[activityType, region, unit, validYear]`.
`activityType` must match either a `TransportMode` value (commute) or `InvoiceCategory` value (invoices)
for automatic calculation to find it.

## Invoices (company/operational emissions)

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/invoices` | Admin/ESG_Manager | query: `category?, departmentId?, dateFrom?, dateTo?, page?, limit?` |
| GET | `/api/admin/invoices/:id` | Admin/ESG_Manager | includes linked `carbonTransaction` |
| POST | `/api/admin/invoices` | Admin/ESG_Manager | auto-calculates emission on create |
| PATCH | `/api/admin/invoices/:id` | Admin/ESG_Manager | recalculates if category/department/unit/quantity/date changes |
| DELETE | `/api/admin/invoices/:id` | Admin/ESG_Manager | soft-delete, deactivates linked transaction |
| POST | `/api/admin/invoices/import` | Admin/ESG_Manager | `multipart/form-data`, field `file` (CSV) |
| GET | `/api/admin/invoices/import/:batchId` | Admin/ESG_Manager | import batch result incl. per-row errors |

`category` enum: `Electricity, Fuel, Diesel, Petrol, Natural_Gas, Air_Travel, Hotel, Office_Purchases, Waste_Disposal`.

CSV import columns (header row required):
`category,departmentCode,vendorName,invoiceNumber,invoiceDate,quantity,unit,amount,currency`
— `departmentCode` is the `Department.code` (e.g. `ENG`), not a UUID. Bad rows are reported individually
(`errorReport: [{ row, reason }]`) and do not fail the rest of the batch.

Creating/updating an invoice with no matching `EmissionFactor` for its category/department-region/unit/year
returns `404` — invoices always require a resolvable factor (unlike commute, which degrades to 0 if the
employee hasn't set up a commute profile yet).

## Carbon Engine (manual recalculation)

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| POST | `/api/admin/carbon-engine/recalculate` | Admin/ESG_Manager | body: `{ employeeIds?[], year, month }` — omit `employeeIds` to recalc all active employees |

Use this for data-fix scenarios (e.g. after correcting a commute profile or an emission factor value).

## Dashboard

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/dashboard/carbon/summary` | any | query: `year?, month?`. Admin/ESG_Manager get company-wide totals; Employee gets only their own commute contribution |
| GET | `/api/dashboard/carbon/trend` | any | query: `months?` (default 12, max 36). Role-scoped like summary |
| GET | `/api/dashboard/carbon/top-sources` | any | query: `year?, month?`. Company-wide, all roles |
| GET | `/api/dashboard/carbon/top-departments` | any | query: `year?, month?`. Company-wide, all roles |
| GET | `/api/dashboard/carbon/me` | any | full monthly history for the caller's own employee record |

## Reports (PDF/Excel export)

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/admin/reports/carbon/monthly?year=&month=&format=pdf\|xlsx` | Admin/ESG_Manager |
| GET | `/api/admin/reports/carbon/yearly?year=&format=pdf\|xlsx` | Admin/ESG_Manager |
| GET | `/api/admin/reports/carbon/department/:departmentId?year=&month=&format=pdf\|xlsx` | Admin/ESG_Manager |
| GET | `/api/admin/reports/carbon/employee/:employeeId?year=&format=pdf\|xlsx` | Admin/ESG_Manager |

All four stream a file (`Content-Type: application/pdf` or
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment`).
`format` defaults to `pdf`. `year`/`month` default to the current period when omitted (yearly/employee
reports default to the current year; employee report `year` is optional — omit for full history).

## Data model notes for the frontend

- Emission values are always **kgCO2e**, exposed as numbers (JSON) or decimal strings depending on
  the Prisma serialization of the specific field — check the Swagger response schema per endpoint.
- Commuting emissions are pre-aggregated per employee/month in `EmployeeMonthlyEmission` — there is no
  per-day emission record exposed; only `Attendance` (raw) and the monthly aggregate are available.
- Company/operational emissions live on `CarbonTransaction`, one per invoice, linked via
  `Invoice.carbonTransactionId`.
