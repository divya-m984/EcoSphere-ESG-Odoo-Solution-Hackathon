# Module Breakdown

## Delivered Foundation Modules

| Module | Current state | Responsibility |
| --- | --- | --- |
| `Prisma` | Implemented | Provides the shared Prisma database client. |
| `Health` | Implemented | API and database health check. |
| `Auth` | Scaffolded | Future authentication and token workflows. |
| `Users` | Scaffolded | Future user administration. |
| `Departments` | Scaffolded | Future department management. |
| `Dashboard` | Scaffolded | Future ESG summary metrics. |
| `Common` | Implemented | Request logging and shared exception handling. |
| `Frontend application` | Scaffolded | React/Vite interface, Material UI theme, route layouts, and placeholder pages. |

## Frontend Application

The frontend provides a public login route and protected routes for Dashboard, Environmental, Social, Governance, Gamification, Reports, Administration, Profile, and Settings. `MainLayout` supplies shared navigation and application chrome. `ProtectedLayout` redirects unauthenticated users to `/login`.

`useAuth` currently simulates login and persists a mock user in browser local storage. It must be replaced with the backend JWT flow before production use. `services/api.ts` is the single configured Axios client; it reads `VITE_API_BASE_URL` and is prepared to attach a bearer token. Feature pages are presentation scaffolds and do not yet call backend endpoints.

## Planned Domain Modules

| Domain | Primary records | Responsibility |
| --- | --- | --- |
| Organisation | Departments, Employees, Users | Hierarchy, workforce ownership, and identity. |
| Environmental | Operations, Emission Factors, Carbon Transactions, Goals | Capture activity, calculate emissions, and track targets. |
| Social | CSR Activities, Participations, Diversity, Training | Social initiatives and workforce metrics. |
| Governance | Policies, Acknowledgements, Audits, Compliance Issues | Policy evidence and governance remediation. |
| Engagement | Challenges, XP, Badges, Rewards, Redemptions | Incentivise and recognise sustainable action. |
| Insights | Department Scores, Reports, Dashboard | Aggregate data into operational and executive views. |
| Platform | ESG Configuration, Notifications | Settings and user communications. |

## Roles

`Admin` manages platform-wide settings, users, reference data, and governance. `ESG_Manager` manages ESG records, approvals, audits, reporting, and departmental performance. `Employee` accesses their profile, acknowledgements, activities, challenges, rewards, and personal participation records. Route permissions must be implemented and tested explicitly.
