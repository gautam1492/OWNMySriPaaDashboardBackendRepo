# SriPAA Growth System API

Backend REST API for the SriPAA clinic operations and finance system. It serves the separately hosted React frontend through `/api/v1` and uses Express, TypeScript, Prisma, and MySQL.

## Features

- Cookie-based authentication with short-lived access tokens, rotating refresh tokens, invitation acceptance, and password reset flows.
- Role- and branch-scoped access for Super Admin, Admin, Director, Accounts & Finance, Data Entry, and Viewer/Auditor users.
- Clinic branches, staff, catalogs, medicine and OTC sales, service sales, card/course sales, patient visits, feedback, expenses, loans, and audit history.
- Dashboard summaries, filtered trend data, and business analytics.
- Request validation, permission checks, rate limiting, credentialed CORS, Helmet security headers, request IDs, and structured logs.
- CSV/XLSX catalog import and filtered business data export.
- Management email alerts for invitation acceptance, sensitive account/permission changes, eligible company-record deletions, and missing daily branch entries. Admins receive organization-wide alerts; Directors receive alerts only for assigned branches; Super Admins receive no management alerts.

## Tech stack

Node.js, TypeScript, Express 5, Prisma 6, MySQL, Zod, JWT, bcryptjs, Nodemailer, Pino, ESLint, Prettier, and Vitest.

## Requirements

- Node.js `>=24.21.0` and npm `>=12.1.0` (per `package.json`).
- MySQL database.
- HTTPS frontend and API origins in production.

## Local setup

```sh
npm install
Copy-Item .env.example .env
# Set DATABASE_URL and JWT_ACCESS_SECRET in .env; configure mail settings if testing email flows.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API defaults to port `5000`; health endpoints are `/health` and `/health/ready`. `db:seed` creates development accounts and requires the `SEED_*_PASSWORD` variables listed in `.env.example`. Both normal and mock-data seeding are blocked when `NODE_ENV=production`; never seed a live production database with demo data.

## Environment variables

Copy `.env.example` to `.env`. Keep credentials in deployment secrets and never commit a real `.env` file.

| Variable                                                                           | Purpose                                                                                                     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                         | `development`, `test`, or `production`.                                                                     |
| `PORT`                                                                             | HTTP listener port.                                                                                         |
| `DATABASE_URL`                                                                     | Prisma MySQL connection string.                                                                             |
| `JWT_ACCESS_SECRET`                                                                | Random signing secret of at least 32 characters.                                                            |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`                                  | Access and refresh lifetimes.                                                                               |
| `CORS_ORIGIN`                                                                      | Comma-separated exact frontend origins; no wildcard with credentialed requests.                             |
| `FRONTEND_URL`                                                                     | Canonical frontend URL used in secure account links.                                                        |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Outbound mail transport and sender.                                                                         |
| `DAILY_DATA_REMINDER_TIME`, `BUSINESS_TIMEZONE`                                    | Schedule and timezone for missing daily-entry reminders.                                                    |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE`                                                | Browser cookie policy. Production requires Secure; separate-site deployments use `SameSite=None` and HTTPS. |
| `LOG_LEVEL`                                                                        | Pino log threshold. Sensitive request data and raw exception messages are excluded from application logs.   |
| `SEED_*_PASSWORD`                                                                  | Development-only seed account passwords, at least 12 characters.                                            |

## Scripts

| Command                                    | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `npm run dev`                              | Start the TypeScript API with reload.                           |
| `npm run build` / `npm start`              | Compile / start the compiled server.                            |
| `npm run lint`                             | Run ESLint.                                                     |
| `npm run format` / `npm run format:check`  | Format source / check formatting.                               |
| `npm test` / `npm run test:watch`          | Run Vitest once / in watch mode.                                |
| `npm run db:generate`                      | Generate Prisma client.                                         |
| `npm run db:migrate`                       | Apply development migrations.                                   |
| `npm run db:deploy`                        | Apply committed migrations in deployment.                       |
| `npm run db:seed` / `npm run db:seed:demo` | Seed development reference or mock data; blocked in production. |

## Folder structure

```text
src/
  config/             environment, database, logger, security configuration
  constants/          shared roles, permissions, messages, status values
  middlewares/        authentication, authorization, validation, errors, request IDs
  modules/            domain modules with routes, controllers, services, repositories, validators
  routes/             API route registration
  types/              Express and shared TypeScript types
  utils/              shared API, security, date, scope, and financial helpers
prisma/               schema, migrations, and development seeders
docs/                 API, OpenAPI, database, and role references
scripts/              maintenance and operational scripts
```

## Production deployment

1. Provision MySQL and configure `DATABASE_URL` as a secret.
2. Configure `NODE_ENV=production`, a strong random `JWT_ACCESS_SECRET`, HTTPS `FRONTEND_URL`, and exact frontend origins in `CORS_ORIGIN`.
3. Configure SMTP credentials as secrets. For a separate frontend/API site, use `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, and HTTPS on both sites.
4. Build the API with `npm ci`, `npm run db:generate`, and `npm run build`.
5. Run `npm run db:deploy` as a release step, then start with `npm start`. Do not run seed commands against production.
6. Configure the frontend's `VITE_API_BASE_URL` to the deployed HTTPS API base, including `/api/v1`. The frontend calls this URL directly; no Vite development proxy is involved.
7. Verify `/health`, `/health/ready`, login/refresh/logout, invitation and password-reset links, email delivery, role and branch boundaries, and the deployed CORS/cookie behavior.

## Security and API references

Authentication uses HttpOnly cookies; the browser does not receive token values in JavaScript. API request bodies are validated at the route boundary. Login and auth routes have IP-based rate limits; password-reset routes have a stricter additional limit. Password-reset links are single-use and expire after 30 minutes. The endpoint intentionally reports when the supplied email has no eligible account. For separate frontend/API domains, configure the exact HTTPS frontend origin in both `CORS_ORIGIN` and `FRONTEND_URL`; production cookies use Secure and default to `SameSite=None`. Read [API.md](docs/API.md), [role-permissions.md](docs/role-permissions.md), and [db-structure.md](docs/db-structure.md) for contracts and data structure. OpenAPI is maintained in [openapi.yaml](docs/openapi.yaml).
