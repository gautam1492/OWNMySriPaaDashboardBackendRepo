# SriPAA Growth System API Reference

This document describes the HTTP API currently mounted by the backend. It is intended to match `src/routes/index.ts` and the route validators in `src/modules`. The machine-readable API contract is maintained separately in [`openapi.yaml`](openapi.yaml).

## API basics

- **Base URL:** `http://localhost:5000/api/v1` (replace host/port for the target environment).
- **Format:** JSON request and response bodies.
- **Authentication:** HttpOnly access and refresh cookies. Send browser requests with credentials enabled (`fetch` `credentials: "include"`; Axios `withCredentials: true`).
- **Date-only values:** `YYYY-MM-DD`.
- **Money:** decimal values; JSON responses serialize database decimals as numbers.
- **Pagination:** list endpoints use `page` (default `1`) and `limit` (default `20`, max `100`).

The health endpoints are outside the API prefix and do not require authentication:

| Method | Path            | Purpose                                                           |
| ------ | --------------- | ----------------------------------------------------------------- |
| GET    | `/health`       | Process liveness.                                                 |
| GET    | `/health/ready` | Database readiness; returns `503` if the database is unavailable. |

## Authentication and sessions

| Method | Path                    | Access         | Purpose                                                                             |
| ------ | ----------------------- | -------------- | ----------------------------------------------------------------------------------- |
| POST   | `/auth/login`           | Public         | Authenticate and set session cookies.                                               |
| POST   | `/auth/refresh`         | Refresh cookie | Rotate the refresh token and issue a new access cookie.                             |
| POST   | `/auth/logout`          | Public         | Clear cookies and revoke the session, including when the access token has expired.  |
| GET    | `/auth/me`              | Authenticated  | Return the current user profile and effective permissions.                          |
| GET    | `/auth/profile`         | Authenticated  | Return account details, role, branches, account status, and effective permissions.  |
| PATCH  | `/auth/profile`         | Authenticated  | Update the current user's name and/or mobile number.                                |
| POST   | `/auth/change-password` | Authenticated  | Change the current user's password.                                                 |
| POST   | `/auth/forgot-password` | Public         | Request a password-reset email; response states whether an eligible account exists. |
| POST   | `/auth/reset-password`  | Public         | Consume a one-time password-reset token (30-minute validity).                       |

`GET /workspace/summary` is available to authenticated roles with `workspace.read`. Branch-scoped roles can pass an optional `branchId`; it must be one of their assignments. Monthly counts are returned only for modules available to that role and are scoped to the selected branch (or assigned branches if no branch is selected). Cross-branch roles receive pending invitation, inactive account, and last-seven-day audit activity counts. It does not return company-level expense counts or dashboard analytics.

Tokens are not returned in response JSON. Refresh tokens are rotated on use. Reuse of a revoked refresh token invalidates its token family.

| Cookie                 | Path           | Flags                                                                   | Default lifetime                |
| ---------------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `sripaa_access_token`  | `/`            | `HttpOnly`; `SameSite` follows `COOKIE_SAME_SITE`; Secure in production | `JWT_ACCESS_EXPIRES_IN` (`15m`) |
| `sripaa_refresh_token` | `/api/v1/auth` | `HttpOnly`; `SameSite` follows `COOKIE_SAME_SITE`; Secure in production | `JWT_REFRESH_EXPIRES_IN` (`7d`) |

`user.branchIds` contains assigned branch IDs. `SUPER_ADMIN` and `ADMIN` may access all active branches; `DIRECTOR` and branch-level roles are restricted to their assigned active branches for branch-specific data. Company-level records are governed by their own permissions and are not branch-scoped.

`POST /auth/login` validates a syntactically valid email (max 255 characters) and password (8–128 characters). The application allows JSON bodies up to 1 MB and CORS is configured for the origins listed in `CORS_ORIGIN` with credentials enabled. The `/api/v1/auth` group is rate limited to 30 requests per 15-minute window per client IP.

Password reset additionally limits `/auth/forgot-password` and `/auth/reset-password` to five requests per 15-minute window per client IP. Reset tokens are one-time use and expire after 30 minutes. `POST /auth/forgot-password` returns a distinct message/status for an unknown email or an account that is inactive/unverified; it does not send an email for those cases. Reset passwords require 8–128 characters and matching `password` and `confirmPassword` values. A successful reset invalidates existing sessions.

## Roles, permissions, and branch scope

The roles are `SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, `ACCOUNTS_FINANCE`, `DATA_ENTRY`, and `VIEWER_AUDITOR`. Access checks combine role defaults, any explicitly granted permissions, user-management hierarchy rules, and branch assignment.

- `SUPER_ADMIN` can access all branches and is the only role allowed to create or manage `ADMIN` accounts.
- `ADMIN` has cross-branch administrative access.
- `DIRECTOR` has full module defaults, with branch-specific data scoped to assigned active branches. Directors must have branch assignments, can manage users at or below Director only within their own assigned branches, and cannot manage Admin or Super Admin accounts. Authorized company-level records remain organization-wide.
- Other roles receive access according to their role defaults and any additional grants.
- Requests for a branch outside the user's scope are rejected with `403`.

Module permissions use `{module}.{action}` keys, where the action is `read`, `create`, `update`, or `delete`. Current module prefixes include `users`, `branches`, `items`, `services`, `sales`, `serviceSales`, `visits`, `feedback`, `courses`, `cards`, `coreInvestments`, `medicinePurchases`, `marketingExpenses`, `csrFunds`, `loans`, `loanRepayments`, `advanceTaxes`, `otherExpenses`, `directorSalaries`, `miscellaneousExpenses`, `branchExpenses`, and `directors`. Read access for several resources is also constrained by authentication and branch scope. See `src/constants/permissions.ts` and `src/constants/roles.ts` for the live grant definitions.

## Common request and response conventions

Successful responses use this shape:

```json
{ "success": true, "message": "Operation completed", "data": {} }
```

List responses include pagination metadata:

```json
{
    "success": true,
    "message": "Success",
    "data": {
        "items": [],
        "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
    }
}
```

Errors use this shape. The `errors` array is included for validation failures:

```json
{
    "success": false,
    "message": "Human-readable error description",
    "errors": [{ "field": "date", "message": "Invalid date" }]
}
```

Common HTTP statuses: `200` success, `201` created, `400` malformed request, `401` authentication required/invalid, `403` forbidden or outside branch scope, `404` not found, `409` conflict, `422` validation failure, `429` rate limited, `500` unexpected server error, and `503` readiness check cannot reach the database.

List filters supported across modules as applicable:

| Query                  | Meaning                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `page`, `limit`        | Pagination.                                                     |
| `search`               | Case-insensitive text search (maximum 100 characters).          |
| `branchId`             | Filter by branch; the branch must be within the caller's scope. |
| `startDate`, `endDate` | Inclusive date range in `YYYY-MM-DD` format.                    |

A resource may support only a subset of these filters; module-specific filters are listed below.

## Endpoint index

All paths below are relative to `/api/v1`. Unless identified as public, endpoints require authentication. Create, update, and delete operations require the matching module permission and branch authorization where applicable.

### Users, roles, and branches

| Resource         | Endpoints                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles            | `GET /roles`                                                                                                                                                                                            |
| Users            | `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/status`, `PATCH /users/:id/role`, `PATCH /users/:id/branches`, `DELETE /users/:id`                                                   |
| Invitations      | `GET /users/invitations`, `POST /users/invitations`, `POST /users/invitations/:id/resend`, `POST /users/invitations/:id/revoke`, `GET /user-invitations/:token`, `POST /user-invitations/:token/accept` |
| User permissions | `GET /users/:id/permissions`, `POST /users/:id/permissions`, `DELETE /users/:id/permissions/:permissionKey`                                                                                             |
| Branches         | `GET /branches`, `POST /branches`, `DELETE /branches/:id`                                                                                                                                               |

New team members should be provisioned with `POST /users/invitations` using `name`, `email`, `roleId`, and `branchIds`. Directors can assign only branches assigned to themselves; branch-scoped roles require active branch assignments. The invitation email contains a one-time link valid for seven days. The invitee completes their profile and chooses a password at `POST /user-invitations/:token/accept`; resending rotates the stored token hash, invalidating the previous link. Expiry notifications are emailed to the inviter. Invitation management is restricted by the same user-role hierarchy as user management. The legacy authenticated `POST /users` endpoint remains available for integrations during rollout.

### Items, services, and sales

| Resource               | Endpoints                                                                                                                      | Notes                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Items                  | `GET /items`, `GET /items/:id`, `POST /items`, `PATCH /items/:id`, `DELETE /items/:id`                                         | Item type is `MEDICINE` or `OTC`. List may filter by `type`.                                                                                                           |
| Services               | `GET /services`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`                                               | Service catalogue/settings.                                                                                                                                            |
| Medicine and OTC sales | `GET /sales`, `GET /sales/:id`, `POST /sales`, `PATCH /sales/:id`, `DELETE /sales/:id`                                         | A sale header with one or more item lines. List filters include `branchId`, `startDate`, `endDate`, `search`, and `entryType` (`OTC` or `DOCTOR_PRESCRIBED_MEDICINE`). |
| Service sales          | `GET /service-sales`, `GET /service-sales/:id`, `POST /service-sales`, `PATCH /service-sales/:id`, `DELETE /service-sales/:id` | Separate service-sale records, independent of medicine/OTC sale lines. List filters include `branchId`, `startDate`, `endDate`, and `serviceType`.                     |

#### Create a medicine or OTC sale

`POST /sales` accepts one sale header and an `items` array. Each line references an item by `itemId` and stores `unitSold`, `unitPrice`, and calculated `totalPrice`. The catalogue item name is snapshotted on the line. Items must be active and their item type must match the sale `entryType`.

```json
{
    "date": "2026-10-27",
    "branchId": "branch-id",
    "entryType": "DOCTOR_PRESCRIBED_MEDICINE",
    "gstPercentage": 5,
    "sgstPercentage": 2.5,
    "items": [
        { "itemId": "medicine-item-id", "unitSold": 2, "unitPrice": 120 },
        { "itemId": "another-medicine-id", "unitSold": 1, "unitPrice": 80 }
    ]
}
```

The service calculates each line total (`unitSold × unitPrice`), the sale subtotal, GST/SGST amounts, and final total. GST and SGST percentages default to 2.5 when omitted; CGST percentage currently defaults to zero. The sale response includes the header, branch, and item lines. Updating a sale replaces its item lines as a single operation. There is no generic account-entry endpoint or shared `AccountEntry`/`AccountEntryItem` write flow; this API stores these records through `Sale`/`SaleItem`.

#### Create a service sale

`POST /service-sales` creates one service sale. `serviceId` must reference an active service whose catalogue type matches `serviceType`.

```json
{
    "date": "2026-10-27",
    "branchId": "branch-id",
    "serviceType": "THERAPY",
    "serviceId": "service-id",
    "amount": 1500
}
```

### Patient visits and feedback

| Resource       | Endpoints                                                                                                | Notes                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Patient visits | `GET /patient-visits`, `POST /patient-visits`, `PATCH /patient-visits/:id`, `DELETE /patient-visits/:id` | Date, branch, `newPatients`, and `followupPatients`.                                              |
| Feedback       | `GET /feedback`, `POST /feedback`, `PATCH /feedback/:id`, `DELETE /feedback/:id`                         | Ratings are integers from 1 to 5. `patientType`: `OPD`/`IPD`; `filledBy`: `PATIENT_SELF`/`STAFF`. |

Patient visit example:

```json
{ "date": "2026-10-27", "branchId": "branch-id", "newPatients": 12, "followupPatients": 9 }
```

Feedback example:

```json
{
    "date": "2026-10-27",
    "branchId": "branch-id",
    "doctor": "Dr. Example",
    "service": "Physiotherapy",
    "patientType": "OPD",
    "filledBy": "PATIENT_SELF",
    "frontdeskRating": 4,
    "posttreatmentRating": 5,
    "comments": "Clear instructions and helpful staff."
}
```

### Course and card sales, settings

| Resource       | Endpoints                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Course doctors | `GET/POST /course-doctors`, `GET/PATCH/DELETE /course-doctors/:id`                               |
| Courses        | `GET/POST /courses`, `GET/PATCH/DELETE /courses/:id`                                             |
| Course sales   | `GET/POST /course-sales`, `GET/PATCH/DELETE /course-sales/:id`                                   |
| Card types     | `GET/POST /card-types`, `GET/PATCH/DELETE /card-types/:id`                                       |
| Card sales     | `GET/POST /card-sales`, `GET/PATCH/DELETE /card-sales/:id`                                       |
| Directors      | `GET /directors`, `GET /directors/:id` (active, verified user accounts with the `DIRECTOR` role) |
| Loans          | `GET/POST /loans`, `GET/PATCH/DELETE /loans/:id`                                                 |

Course sale create fields: `courseId`, `courseDoctorId`, `purchaseDate`, `numberOfCourses`, `pricePerCourse`, `customerId`, and `membershipType` (`GREEN_CARD`, `GOLDEN_CARD`, or `OTHER`); `discount` is optional and defaults to zero. Course and course-doctor filters are available on the list endpoint.

Card sale create fields: `cardTypeId`, `date`, `cardPrice`, and `numberOfCards`. Card sales use `cards.*` permissions and are stored as dedicated card-sale records.

Course/card sales are separate from medicine/OTC sales and service sales; they do not share a generic account-entry endpoint.

### Company expenses

The following company-level expense/settings resources use list, detail, create, update, and delete routes (`GET /resource`, `GET /resource/:id`, `POST /resource`, `PATCH /resource/:id`, `DELETE /resource/:id`):

| Resource path                     | Main fields / filters                                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/core-investments`               | Item name, invoice ID, price, billing/payment dates, tax rates; branch attribution can be supplied where allowed. List filters include independent bill-date and paid-date ranges.                                                           |
| `/medicine-purchases`             | Invoice ID, price, billing/payment dates, tax rates. List filters include independent bill-date and paid-date ranges.                                                                                                                        |
| `/marketing-expenses`             | Company, invoice ID, price, billing/payment dates, GST/SGST, expense month/year. List filters include expense period and independent bill-date and paid-date ranges.                                                                         |
| `/csr-funds`                      | Month/year, last month's total income, percentage, and caller-supplied amount. The amount is currently stored as submitted.                                                                                                                  |
| `/loans`                          | Loan name, original amount, and calculated outstanding balance (`originalAmount` minus all recorded repayments). The outstanding balance is returned on loan reads and is recalculated after repayment create, update, or delete operations. |
| `/loan-repayments`                | Loan, month/year, repayment amount. Repayments cannot exceed the loan's current outstanding balance; creating, editing, or deleting a repayment changes the calculated loan balance.                                                         |
| `/advance-taxes`                  | Month/year and amount paid.                                                                                                                                                                                                                  |
| `/other-expenses`                 | Item name, invoice ID, price, billing/payment dates, GST/SGST, year. List filters include year and independent bill-date and paid-date ranges.                                                                                               |
| `/director-salaries`              | Director, month/year, amount.                                                                                                                                                                                                                |
| `/company-miscellaneous-expenses` | Item name, voucher ID, price, date, GST/SGST, payment method (`ONLINE`/`CASH`).                                                                                                                                                              |

For applicable expense inputs, `gst` and `sgst` are percentage rates. The backend calculates tax amounts and `totalAmount`; calculated values are returned by the API and are not intended as client-supplied inputs. Taxed expense total = base price + calculated GST + calculated SGST.

### Branch expenses

Branch expenses are separate category resources under `/branch-expenses`. Each entry includes its `branchId` and is checked against the caller's branch access.

| Category             | Collection path                         | Main fields                                                                                                           |
| -------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Salary               | `/branch-expenses/salaries`             | `branchId`, `personName`, `role`, `month`, `year`, `salary`, `dateCredited`, `totalAmount`                            |
| Rent                 | `/branch-expenses/rent`                 | `branchId`, `month`, `year`, `invoiceId`, `rentAmount`, `tdsPercentage`; TDS deduction and net amount are calculated. |
| Water bill           | `/branch-expenses/water-bills`          | `branchId`, amount, bill ID, assigned date, paid date, month, year.                                                   |
| Power bill           | `/branch-expenses/power-bills`          | `branchId`, amount, bill ID, assigned date, paid date, month, year.                                                   |
| Food & groceries     | `/branch-expenses/food-groceries`       | `branchId`, invoice ID, amount, date, month, year.                                                                    |
| Government fees      | `/branch-expenses/government-fees`      | `branchId`, item name, invoice ID, price, date, GST/SGST rates, year.                                                 |
| Investment purchases | `/branch-expenses/investment-purchases` | `branchId`, item name, invoice ID, price, date, GST/SGST rates, year.                                                 |
| Miscellaneous        | `/branch-expenses/miscellaneous`        | `branchId`, item name, voucher ID, price, date, GST/SGST rates, payment method, year.                                 |

Each collection path supports `GET` and `POST`; individual records support `GET /:id`, `PATCH /:id`, and `DELETE /:id`. Applicable tax amounts and totals are calculated by the backend. Salary requires the explicitly submitted `totalAmount`; rent calculates TDS deduction and net amount.

### Dashboards and audit

| Method | Path                 | Purpose                                       |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/dashboard/summary` | KPI and aggregate summary.                    |
| GET    | `/dashboard/trends`  | Time-series reporting.                        |
| GET    | `/audit`             | Paginated audit records for authorized roles. |

Dashboard endpoints accept period filters supported by the dashboard validator (`period` and optional date/branch filters as implemented). Audit listing supports pagination and audit-specific filters such as action, resource type, resource ID, and user ID.

Management email notifications are sent for invitation acceptance, company-record deletions, role/status changes, and permission grants/revocations. Admins receive organization-wide notifications; Directors receive notifications only for assigned branches; Super Admins are excluded. Daily missing-entry reminders check active branches for a `PatientVisit` and medicine/OTC `Sale` dated today in `BUSINESS_TIMEZONE`. Admins receive all branch results, while each Director receives only results for assigned branches. Invitation-expiry notices go to the inviter.

## Important data flow distinctions

- A medicine/OTC sale is saved as a `Sale` header with multiple `SaleItem` rows. `SaleItem.itemId` references the catalogue `Item`; its `itemNameSnapshot`, unit price, quantity, and line total preserve what was sold at that time.
- A service sale is one `ServiceSale` record and remains distinct from medicine/OTC sale records.
- Course sales and card sales each use their dedicated record type.
- Expenses use their dedicated company- or branch-expense resource. There is no generic account-entry API endpoint in the currently mounted routes.
- Reports and dashboards read these domain records; clients should use the resource APIs above to create or update source records.

## Error handling and limits

Request bodies and query parameters are validated. Invalid inputs return `422` with field-level errors. Lists default to 20 rows per page and cap at 100. The `/api/v1/auth` route group is limited to 30 requests per 15 minutes per client IP; forgot-password and reset-password endpoints have an additional limit of five requests per 15 minutes per IP. Cookies are HttpOnly, use the configured `COOKIE_SAME_SITE`, and are Secure in production. For separate-site frontend and API domains, use HTTPS and `SameSite=None`.

## Local development

```sh
npm install
# Configure .env with DATABASE_URL and the authentication secrets required by the app.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run build` builds TypeScript; `npm test` runs the Vitest suite. Confirm the package scripts and required environment values for the current checkout before running these commands.

---

## Detailed setup, access, and request guide

This expanded section explains the prerequisites and permission checks behind the endpoint index above. It is based on the current `src/routes/index.ts`, module route files, validators, and permission constants.

### Requirements before making requests

1. **Run the backend and database.** The API uses Node.js/Express and Prisma with MySQL. The package currently declares Node.js `>=24.21.0` and npm `>=12.1.0`.
2. **Configure the required environment values.** At minimum, set `DATABASE_URL` and a `JWT_ACCESS_SECRET` at least 32 characters long. `PORT` defaults to `5000`; `CORS_ORIGIN` defaults to `http://localhost:5173` and accepts comma-separated origins; `COOKIE_SECURE` defaults to `false` for local development. Access and refresh lifetimes default to `15m` and `7d`.
3. **Prepare the database.** Generate the Prisma client, apply migrations, and seed the initial roles/permissions/users for the environment. The API cannot serve useful database-backed operations until migrations are applied and the database is reachable.
4. **Sign in.** Call `POST /api/v1/auth/login` and preserve the response cookies. Browser clients must send credentials on subsequent requests. Non-browser clients should store and resend cookies securely.
5. **Use IDs returned by the API.** Forms typically load branches and catalogue/settings records first, then submit their IDs (`branchId`, `itemId`, `serviceId`, etc.). Do not submit display names where the schema requires an ID.
6. **Send JSON.** Set `Content-Type: application/json` for JSON bodies. Query parameters are strings on the wire; numeric query parameters are parsed and validated by the API.

Example local startup:

```sh
npm install
# Create .env from .env.example and set DATABASE_URL and JWT_ACCESS_SECRET.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Use HTTPS and `COOKIE_SECURE=true` outside local development. The frontend origin must match a configured `CORS_ORIGIN` and credentialed cross-origin requests must include cookies.

### Sign-in example and cookie handling

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"admin@example.com","password":"your-password"}
```

A successful login sets `sripaa_access_token` and `sripaa_refresh_token` as HttpOnly cookies. The body returns the user and access-cookie expiry, but not either token. For browser fetch:

```js
const response = await fetch("http://localhost:5000/api/v1/sales?page=1&limit=20", {
    credentials: "include",
});
const result = await response.json();
```

For an expired access cookie, call `POST /api/v1/auth/refresh` with the refresh cookie; the endpoint rotates it and sets new cookies. Call `POST /api/v1/auth/logout` to revoke the session and clear cookies. `POST /api/v1/auth/change-password` requires `currentPassword` and `newPassword` (minimum eight characters); a successful password change clears the current cookies, so the user signs in again.

### Roles and hierarchy

Role hierarchy, highest to lowest:

| Rank | Role               | Branch scope           | User-management boundary                                                                                                                                                |
| ---: | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    5 | `SUPER_ADMIN`      | All branches           | May create and manage all roles, including Admin.                                                                                                                       |
|    4 | `ADMIN`            | All branches           | May manage Director and lower roles; cannot manage Admin or Super Admin.                                                                                                |
|    3 | `DIRECTOR`         | Assigned branches      | Has full module defaults, but branch data and user branch assignments are limited to the Director's own assigned branches. Cannot manage Admin or Super Admin accounts. |
|    2 | `ACCOUNTS_FINANCE` | Assigned branches only | No user-management access.                                                                                                                                              |
|    1 | `DATA_ENTRY`       | Assigned branches only | No user-management access.                                                                                                                                              |
|    0 | `VIEWER_AUDITOR`   | Assigned branches only | Read-oriented business access and audit-log access; no user-management access.                                                                                          |

**Admin account protection:** only `SUPER_ADMIN` may create, edit, re-role, change branches/status, grant permissions to, or delete an `ADMIN` account. This check applies even to ordinary profile edits such as name, email, or mobile number. A hierarchy violation returns `403`.

### Default permission matrix

Permission names use `{module}.{action}`. `R` = read, `C` = create, `U` = update, `D` = delete. `—` means no default permission grant. The first three roles receive the full permission registry; route-specific checks and user hierarchy still apply.

| Module                                 | SUPER_ADMIN | ADMIN   | DIRECTOR | ACCOUNTS_FINANCE | DATA_ENTRY | VIEWER_AUDITOR |
| -------------------------------------- | ----------- | ------- | -------- | ---------------- | ---------- | -------------- |
| `users`                                | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | R              |
| `branches`                             | R/C/U/D     | R/C/U/D | R/C/U/D  | R                | —          | R              |
| `items`                                | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | R              |
| `services`                             | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | R              |
| `sales` (medicine/OTC)                 | R/C/U/D     | R/C/U/D | R/C/U/D  | R/C/U            | R/C/U      | R              |
| `serviceSales`                         | R/C/U/D     | R/C/U/D | R/C/U/D  | R                | R/C/U      | R              |
| `visits`                               | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | R/C/U      | R              |
| `feedback`                             | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | R/C/U      | R              |
| `courses` (catalogue and course sales) | R/C/U/D     | R/C/U/D | R/C/U/D  | R                | —          | —              |
| `cards` (card types and card sales)    | R/C/U/D     | R/C/U/D | R/C/U/D  | R                | —          | —              |
| `coreInvestments`                      | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `medicinePurchases`                    | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `marketingExpenses`                    | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `csrFunds`                             | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `loans`                                | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `loanRepayments`                       | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `advanceTaxes`                         | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `otherExpenses`                        | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `directorSalaries`                     | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `miscellaneousExpenses` (company)      | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |
| `branchExpenses`                       | R/C/U/D     | R/C/U/D | R/C/U/D  | R/C/U            | —          | —              |
| `directors`                            | R/C/U/D     | R/C/U/D | R/C/U/D  | —                | —          | —              |

This matrix describes stored default grants, not the only route guard. The endpoint-by-endpoint access table below notes routes that use authentication or a role check instead of an explicit module permission.

`ACCOUNTS_FINANCE` has read access to revenue, create/update access for medicine and OTC sales, and read/create/update access for branch expenses. It has no company-expense or corporate-loan permissions. Branch-aware records remain limited to its assigned branches; branch expense deletion remains administrator-managed.

`DATA_ENTRY` has read/create/update access to medicine and OTC sales, service sales, patient visits, and patient feedback. It has no default delete permissions, and branch-aware records remain limited to assigned branches.

### Permission keys by module

All listed module prefixes define the actions `read`, `create`, `update`, and `delete`:

| API area                              | Permission prefix       | Example keys                                                                                                                 |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| User accounts                         | `users`                 | `users.read`, `users.create`, `users.update`, `users.delete`                                                                 |
| Branches                              | `branches`              | `branches.read`, `branches.create`, `branches.update`, `branches.delete`                                                     |
| Items                                 | `items`                 | `items.read`, `items.create`, `items.update`, `items.delete`                                                                 |
| Services                              | `services`              | `services.read`, `services.create`, `services.update`, `services.delete`                                                     |
| Medicine/OTC sales                    | `sales`                 | `sales.read`, `sales.create`, `sales.update`, `sales.delete`                                                                 |
| Service sales                         | `serviceSales`          | `serviceSales.read`, `serviceSales.create`, `serviceSales.update`, `serviceSales.delete`                                     |
| Patient visits                        | `visits`                | `visits.read`, `visits.create`, `visits.update`, `visits.delete`                                                             |
| Feedback                              | `feedback`              | `feedback.read`, `feedback.create`, `feedback.update`, `feedback.delete`                                                     |
| Course doctors, courses, course sales | `courses`               | `courses.read`, `courses.create`, `courses.update`, `courses.delete`                                                         |
| Card types and card sales             | `cards`                 | `cards.read`, `cards.create`, `cards.update`, `cards.delete`                                                                 |
| Core investments                      | `coreInvestments`       | `coreInvestments.read`, `coreInvestments.create`, `coreInvestments.update`, `coreInvestments.delete`                         |
| Medicine purchases                    | `medicinePurchases`     | `medicinePurchases.read`, `medicinePurchases.create`, `medicinePurchases.update`, `medicinePurchases.delete`                 |
| Marketing expenses                    | `marketingExpenses`     | `marketingExpenses.read`, `marketingExpenses.create`, `marketingExpenses.update`, `marketingExpenses.delete`                 |
| CSR funds                             | `csrFunds`              | `csrFunds.read`, `csrFunds.create`, `csrFunds.update`, `csrFunds.delete`                                                     |
| Loans                                 | `loans`                 | `loans.read`, `loans.create`, `loans.update`, `loans.delete`                                                                 |
| Loan repayments                       | `loanRepayments`        | `loanRepayments.read`, `loanRepayments.create`, `loanRepayments.update`, `loanRepayments.delete`                             |
| Advance taxes                         | `advanceTaxes`          | `advanceTaxes.read`, `advanceTaxes.create`, `advanceTaxes.update`, `advanceTaxes.delete`                                     |
| Other expenses                        | `otherExpenses`         | `otherExpenses.read`, `otherExpenses.create`, `otherExpenses.update`, `otherExpenses.delete`                                 |
| Director salaries                     | `directorSalaries`      | `directorSalaries.read`, `directorSalaries.create`, `directorSalaries.update`, `directorSalaries.delete`                     |
| Company miscellaneous                 | `miscellaneousExpenses` | `miscellaneousExpenses.read`, `miscellaneousExpenses.create`, `miscellaneousExpenses.update`, `miscellaneousExpenses.delete` |
| Branch expenses                       | `branchExpenses`        | `branchExpenses.read`, `branchExpenses.create`, `branchExpenses.update`, `branchExpenses.delete`                             |

Course and card sales deliberately reuse their settings modules' permission prefixes: course sales use `courses.*`, and card sales use `cards.*`.

### Important implementation detail: permission-grant request allowlist

`POST /users/:id/permissions` currently validates permission keys against only these prefixes: `users`, `branches`, `items`, `services`, `sales`, `serviceSales`, `visits`, and `feedback`. The permission catalog and role defaults also define course, card, and expense keys, but the current grant-request validator rejects those keys. This is a code-level allowlist limitation; it is documented here so clients do not assume every key in the catalog can currently be granted through this endpoint.

The grant service currently checks the caller's saved `UserPermission` rows when deciding whether the caller can grant a key. It does not treat role-default permissions as grantable for this check. Consequently, even a manager whose role defaults include a key may need that key explicitly saved on their own user record before this endpoint will let them grant it to a user they may manage. `SUPER_ADMIN` bypasses permission middleware, but this grant-service check still applies.

Permission-management endpoints:

| Method and path                                | Required caller                                                         | Body / result                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `GET /users/:id/permissions`                   | `SUPER_ADMIN`, `ADMIN`, or `DIRECTOR`, subject to target-role hierarchy | Returns saved extra grants, grantor, and grant time.    |
| `POST /users/:id/permissions`                  | Same manager/hierarchy rules; caller must hold every key being granted  | `{ "permissionKeys": ["sales.read"] }`; appends grants. |
| `DELETE /users/:id/permissions/:permissionKey` | Same manager/hierarchy rules                                            | Removes one saved extra grant.                          |

The permission endpoints do not edit the role's default grants. Effective permissions are computed when authenticating; the user should refresh their session or sign in again after their role or permission grants change.

### Endpoint-by-endpoint access checks

A route may enforce an explicit permission, a role list, authentication only, branch scope, or a combination. Do not infer the runtime access rule solely from the role matrix.

| Resource                                       | Read access                                                              | Create                       | Update                       | Delete                       |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- | ---------------------------- | ---------------------------- |
| `/roles`                                       | Manager role (`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`)                        | —                            | —                            | —                            |
| `/users`                                       | Manager role                                                             | Manager + hierarchy          | Manager + hierarchy          | Manager + hierarchy          |
| `/branches`                                    | Any authenticated user                                                   | `branches.create`            | Not implemented              | `branches.delete`            |
| `/items`                                       | Any authenticated user                                                   | `items.create`               | `items.update`               | `items.delete`               |
| `/services`                                    | Any authenticated user                                                   | `services.create`            | `services.update`            | `services.delete`            |
| `/sales`                                       | `sales.read`                                                             | `sales.create`               | `sales.update`               | `sales.delete`               |
| `/service-sales`                               | `serviceSales.read`                                                      | `serviceSales.create`        | `serviceSales.update`        | `serviceSales.delete`        |
| `/patient-visits`                              | `visits.read`                                                            | `visits.create`              | `visits.update`              | `visits.delete`              |
| `/feedback`                                    | Any authenticated user                                                   | `feedback.create`            | `feedback.update`            | `feedback.delete`            |
| `/course-doctors`, `/courses`, `/course-sales` | Any authenticated user                                                   | `courses.create`             | `courses.update`             | `courses.delete`             |
| `/card-types`, `/card-sales`                   | Any authenticated user                                                   | `cards.create`               | `cards.update`               | `cards.delete`               |
| Company expense resources                      | Any authenticated user                                                   | Resource-specific `*.create` | Resource-specific `*.update` | Resource-specific `*.delete` |
| `/branch-expenses/*`                           | Any authenticated user plus branch checks                                | `branchExpenses.create`      | `branchExpenses.update`      | `branchExpenses.delete`      |
| `/directors`                                   | Any authenticated user; returns active accounts with the `DIRECTOR` role | —                            | —                            | —                            |
| `/dashboard/*`                                 | SUPER_ADMIN, ADMIN, DIRECTOR only                                        | —                            | —                            | —                            |
| `/audit`                                       | `SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, `VIEWER_AUDITOR`                     | —                            | —                            | —                            |

The current routes for some lists/detail reads use authentication only even where a corresponding `*.read` permission exists in the catalog (for example items, services, feedback, course/card resources, and expense resources). `sales`, `service-sales`, and patient visits do explicitly check their read permission. The table above reflects actual route middleware.

### Branch-scoping rules

- `SUPER_ADMIN` and `ADMIN` have all-branch access. Directors require assignments and are scoped to those assigned branches for branch-specific data and user branch assignments.
- `ACCOUNTS_FINANCE`, `DATA_ENTRY`, and `VIEWER_AUDITOR` can access only their assigned branches.
- On branch-aware data, `branchId` filters cannot expand access beyond the caller's assignments. A request for an inaccessible branch returns `403`.
- Branch-expense create/update and detail operations check branch access. Medicine/OTC sale and service-sale writes check branch access as well. Directors can access only their assigned active branches.
- Some organization-wide company expenses are not branch-linked; `core-investments` accepts `belongsTo: "COMPANY"` or `"BRANCH"` and can include `branchId` for branch attribution.

### Pagination and filtering details

All paginated lists default to `page=1` and `limit=20`; `limit` must be between 1 and 100. Common optional filters are `search` (up to 100 characters), `branchId`, `startDate`, and `endDate`, only where supported by that list validator.

| List                                      | Additional filters                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `/items`                                  | `type=MEDICINE\|OTC`                                                                    |
| `/sales`                                  | `entryType=OTC\|DOCTOR_PRESCRIBED_MEDICINE`; search matches a saved item-name snapshot. |
| `/service-sales`                          | `serviceType=CONSULTATION\|THERAPY\|OTHER`                                              |
| `/courses`                                | `courseDoctorId`, `isActive`                                                            |
| `/course-sales`                           | `courseId`, `courseDoctorId`, `startDate`, `endDate`                                    |
| `/card-types`                             | `isActive`                                                                              |
| `/card-sales`                             | `cardTypeId`, `startDate`, `endDate`                                                    |
| `/marketing-expenses`                     | `expenseMonth` (1–12), `expenseYear` (2023 or later)                                    |
| `/csr-funds`, `/advance-taxes`            | `month` (1–12), `year` (2023 or later)                                                  |
| `/loan-repayments`                        | `loanId`, `month`, `year`                                                               |
| `/other-expenses`                         | `year`, `startDate`, `endDate`                                                          |
| `/director-salaries`                      | `directorId`, `month`, `year`                                                           |
| `/branch-expenses/{category}`             | `branchId`, `month` (uppercase month enum), `year`, `startDate`, `endDate`              |
| `/audit`                                  | `action`, `resourceType`, `resourceId`, `userId`                                        |
| `/dashboard/summary`, `/dashboard/trends` | `period=daily\|weekly\|monthly\|yearly`, `startDate`, `endDate`, `branchId`             |

---

## Detailed request schemas and examples

Unless stated otherwise, create/update request fields are validated with Zod. Dates must be valid `YYYY-MM-DD` values; IDs are non-empty strings. Numeric money inputs must be non-negative and are capped at `999999999.99`. Update (`PATCH`) schemas are partial versions of create schemas unless noted.

### Users, branches, and master data

| Endpoint                    | Required create fields                                              | Optional fields / constraints                                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /users`               | `name` (2–160), `email` (valid email), `password` (8–128), `roleId` | `branchIds` (up to 50 IDs), `mobileNumber` (nullable, max 30 chars). Target role and branches must be manageable by the caller.                                                                                                                                          |
| `PATCH /users/:id`          | None; profile fields are optional                                   | `name`, `email`, `roleId`, `mobileNumber`, `isActive`; password is not accepted here. Use `PATCH /users/:id/branches` to change `branchIds`. The validator also permits `branchIds` on this route, but the dedicated route is the supported branch-assignment operation. |
| `PATCH /users/:id/status`   | `isActive` boolean                                                  | —                                                                                                                                                                                                                                                                        |
| `PATCH /users/:id/role`     | `roleId`                                                            | Subject to hierarchy.                                                                                                                                                                                                                                                    |
| `PATCH /users/:id/branches` | `branchIds` array                                                   | Up to 50 IDs; branch IDs must exist and be active.                                                                                                                                                                                                                       |
| `POST /branches`            | `name` (1–160), `code` (1–32)                                       | —                                                                                                                                                                                                                                                                        |
| `POST /items`               | `name` (2–160), `type` (`MEDICINE` or `OTC`)                        | `isActive` boolean.                                                                                                                                                                                                                                                      |
| `POST /services`            | `name` (2–160), `type` (`CONSULTATION`, `THERAPY`, `OTHER`)         | `isActive` boolean.                                                                                                                                                                                                                                                      |
| `POST /course-doctors`      | `name`                                                              | Optional `specialization`, `isActive`.                                                                                                                                                                                                                                   |
| `POST /courses`             | `name`, `courseDoctorId`                                            | `isActive`.                                                                                                                                                                                                                                                              |
| `POST /card-types`          | `name`, `defaultPrice`                                              | `isActive`.                                                                                                                                                                                                                                                              |
| `POST /loans`               | `name`, `originalAmount`                                            | `isActive`.                                                                                                                                                                                                                                                              |

Example create catalogue item:

```json
{ "name": "Brahmi Tablets", "type": "MEDICINE", "isActive": true }
```

### Medicine/OTC sale fields and calculations

`POST /sales` requires `date`, `branchId`, `entryType`, and 1–100 `items`. Each line requires `itemId`, `unitSold` (integer 1–100000), and `unitPrice` (non-negative). Optional header tax inputs are `gstPercentage` and `sgstPercentage` (0–100); omitted values default to 2.5. The current implementation sets CGST percentage to zero.

The backend verifies that every referenced item exists, is active, and has the type corresponding to the sale entry type. It calculates and returns:

- each line's `totalPrice = unitSold × unitPrice`;
- header `subtotal` as the sum of line totals;
- `gstAmount`, `sgstAmount`, `cgstAmount` and their rates;
- header `totalAmount` as subtotal plus calculated taxes.

Tax amounts are calculated on the sale subtotal and rounded to two decimal places. Do not include tax amounts, MRP, or line totals in the submitted item lines; they are derived/stored by the server. The sale item refers to `itemId` and preserves `itemNameSnapshot` so later catalogue renames do not rewrite what the sale line originally displayed.

Create example:

```json
{
    "date": "2026-10-27",
    "branchId": "clx-branch-id",
    "entryType": "OTC",
    "gstPercentage": 5,
    "sgstPercentage": 2.5,
    "items": [
        { "itemId": "clx-ginger-candy", "unitSold": 3, "unitPrice": 25.5 },
        { "itemId": "clx-herbal-drops", "unitSold": 1, "unitPrice": 80 }
    ]
}
```

To edit, send a complete replacement sale body to `PATCH /sales/:id`; the endpoint replaces the sale's line collection with the supplied `items` and recalculates totals. Delete removes the sale and its lines.

### Service sale fields

`POST /service-sales` requires `date`, `branchId`, `serviceType`, `serviceId`, and `amount`. `serviceType` must be `CONSULTATION`, `THERAPY`, or `OTHER` and must match the active service record referenced by `serviceId`. The amount belongs to the sale transaction; it is not stored on the service catalogue record.

```json
{
    "date": "2026-10-27",
    "branchId": "clx-branch-id",
    "serviceType": "THERAPY",
    "serviceId": "clx-service-id",
    "amount": 1500
}
```

The API stores one independent `ServiceSale`, including a service-name snapshot; it does not create medicine/OTC sale lines.

### Patient visits and feedback

`POST /patient-visits` requires `date`, `branchId`, `newPatients` and `followupPatients` (non-negative integers). `PATCH` accepts any subset of those fields.

`POST /feedback` requires `date`, `branchId`, `doctor`, `service`, `patientType` (`OPD`/`IPD`), `filledBy` (`PATIENT_SELF`/`STAFF`), `frontdeskRating` and `posttreatmentRating` (each integer 1–5). `comments` is optional, nullable, up to 5000 characters.

### Course and card sale requests

`POST /course-sales` requires `courseId`, `courseDoctorId`, `purchaseDate`, `numberOfCourses` (integer >=1), `pricePerCourse`, `customerId`, and `membershipType` (`GREEN_CARD`, `GOLDEN_CARD`, or `OTHER`). `discount` is optional and defaults to zero. Total is calculated as `numberOfCourses × pricePerCourse − discount`.

```json
{
    "courseId": "clx-course-id",
    "courseDoctorId": "clx-course-doctor-id",
    "purchaseDate": "2026-10-27",
    "numberOfCourses": 2,
    "pricePerCourse": 5000,
    "discount": 500,
    "customerId": "USR-10023",
    "membershipType": "GREEN_CARD"
}
```

`POST /card-sales` requires `cardTypeId`, `date`, `cardPrice`, and `numberOfCards` (integer >=1). Total is `cardPrice × numberOfCards`.

```json
{
    "cardTypeId": "clx-card-type-id",
    "date": "2026-10-27",
    "cardPrice": 1200,
    "numberOfCards": 2
}
```

Neither course-sale nor card-sale schemas currently accept `branchId`.

### Company expense request fields

For expenses with GST/SGST fields, `gst` and `sgst` are percentage rates, not tax amounts. They default to zero if omitted. The API calculates `gstAmount`, `sgstAmount`, and `totalAmount = price + gstAmount + sgstAmount`; submit the base price and rates only.

| Endpoint                               | Required create fields                                                                                              | Optional/additional fields                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /core-investments`               | `itemName`, `invoiceId`, `price`, `billingDate`, `paymentDate`, `belongsTo` (`COMPANY`/`BRANCH`)                    | `gst`, `sgst`, optional `branchId`; branch access applies when branch ID is given.                                                                                           |
| `POST /medicine-purchases`             | `invoiceId`, `price`, `billingDate`, `paymentDate`                                                                  | `gst`, `sgst`.                                                                                                                                                               |
| `POST /marketing-expenses`             | `companyName`, `invoiceId`, `price`, `billingDate`, `paymentDate`, `expenseMonth` (1–12), `expenseYear` (>=2023)    | `gst`, `sgst`.                                                                                                                                                               |
| `POST /csr-funds`                      | `month`, `year`, `lastMonthTotalIncome`, `percentage`, `amount`                                                     | `amount` is required and stored as submitted. The intended business formula is previous income × percentage / 100, but the current service does not calculate or replace it. |
| `POST /loans`                          | `name`, `originalAmount`                                                                                            | `isActive`.                                                                                                                                                                  |
| `POST /loan-repayments`                | `loanId`, `month`, `year`, `repaymentAmount`                                                                        | —                                                                                                                                                                            |
| `POST /advance-taxes`                  | `month`, `year`, `amountPaid`                                                                                       | —                                                                                                                                                                            |
| `POST /other-expenses`                 | `itemName`, `invoiceId`, `price`, `billingDate`, `paymentDate`, `year` (>=2023)                                     | `gst`, `sgst`.                                                                                                                                                               |
| `POST /director-salaries`              | `directorId` (the user's ID; account must be active, verified, and have role `DIRECTOR`), `month`, `year`, `amount` | —                                                                                                                                                                            |
| `POST /company-miscellaneous-expenses` | `itemName`, `voucherId`, `price`, `date`, `paymentMethod` (`ONLINE`/`CASH`)                                         | `gst`, `sgst`.                                                                                                                                                               |

Example Other Expense:

```json
{
    "itemName": "Printer paper",
    "invoiceId": "INV-OE-204",
    "price": 1000,
    "billingDate": "2026-10-05",
    "paymentDate": "2026-10-06",
    "gst": 18,
    "sgst": 9,
    "year": 2026
}
```

Expected calculated amounts for this example: GST `180`, SGST `90`, total `1270`.

### Branch expense request fields

All branch-expense requests require the relevant `branchId`; the server checks that branch against the logged-in user. `month` is the uppercase month name (`JANUARY` through `DECEMBER`), and `year` must be 2023–2100.

| Path                                    | Required create fields                                                                          | Server-calculated fields                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/branch-expenses/salaries`             | `branchId`, `personName`, `role`, `month`, `year`, `salary`, `dateCredited`, `totalAmount`      | No derived payroll total; client must submit `totalAmount` as requested by the current validator. |
| `/branch-expenses/rent`                 | `branchId`, `month`, `year`, `invoiceId`, `rentAmount`, `tdsPercentage`                         | `tdsDeduction = rentAmount × tdsPercentage / 100`; `netAmount = rentAmount − tdsDeduction`.       |
| `/branch-expenses/water-bills`          | `branchId`, `amount`, `billId`, `paidDate`, `assignedDate`, `month`, `year`                     | —                                                                                                 |
| `/branch-expenses/power-bills`          | `branchId`, `amount`, `billId`, `assignedDate`, `paidDate`, `month`, `year`                     | —                                                                                                 |
| `/branch-expenses/food-groceries`       | `branchId`, `invoiceId`, `amount`, `date`, `month`, `year`                                      | `totalAmount` equals `amount`.                                                                    |
| `/branch-expenses/government-fees`      | `branchId`, `itemName`, `invoiceId`, `price`, `date`, `year`                                    | GST/SGST amounts and total; `gst` and `sgst` are optional and default to zero.                    |
| `/branch-expenses/investment-purchases` | Same shape as government fees                                                                   | GST/SGST amounts and total.                                                                       |
| `/branch-expenses/miscellaneous`        | `branchId`, `itemName`, `voucherId`, `price`, `date`, `paymentMethod` (`ONLINE`/`CASH`), `year` | GST/SGST amounts and total.                                                                       |

Example branch miscellaneous entry:

```json
{
    "branchId": "clx-branch-id",
    "itemName": "Cleaning supplies",
    "voucherId": "VCH-55",
    "price": 800,
    "date": "2026-10-27",
    "gst": 5,
    "sgst": 2.5,
    "paymentMethod": "CASH",
    "year": 2026
}
```

### Dashboard and audit filters

`GET /dashboard/summary` and `GET /dashboard/trends` accept optional `period` (`daily`, `weekly`, `monthly`, `yearly`), `startDate`, `endDate`, and `branchId`. A date range overrides period-derived dates where both are provided. Results include sales and service revenue, patient counts, feedback classifications, trends, product summaries, or recent feedback depending on the endpoint. Dashboard branch filters cannot grant access to an unassigned branch.

`GET /audit` accepts normal pagination plus optional `action` (max 120 characters), `resourceType` (max 80), `resourceId`, and `userId`. It is restricted to Super Admin, Admin, Director, and Viewer/Auditor roles.

## Implementation caveats to resolve in code

These are current behaviors clients should know; they do not change the API contract by themselves:

1. **Grant-key allowlist:** as noted above, permission grant requests currently accept only eight permission prefixes even though the permission registry contains many more.
2. **Read routes:** several list and detail endpoints are guarded by authentication without a matching `*.read` middleware check. The endpoint access table documents the actual routes; the role-default matrix documents default permission values.
3. **Card/course branch:** their current create validators do not accept `branchId`; do not send it.
4. **Branch update:** the mounted branches API supports list, create, and delete; it does not currently expose `PATCH /branches/:id`.
5. **User branch assignments:** use `PATCH /users/:id/branches` for replacing a user branch assignment; the profile patch validator also permits `branchIds`, but that route does not apply assignments through the branch relation.
6. **Branch salary total:** `totalAmount` is required input; unlike rent/taxed expenses, the current branch salary service does not calculate it.
7. **CSR amount:** `amount` is required and stored as submitted; the service does not calculate it from income and percentage.

---

## Development seed accounts

`npm run db:seed` creates development accounts. Seed passwords are supplied through the `SEED_*_PASSWORD` environment variables in `.env`; the repository documentation intentionally does not publish credentials. Use a private development database, keep seed credentials out of logs and source control, and never run seed commands in production. The demo seeder is also blocked when `NODE_ENV=production`.
