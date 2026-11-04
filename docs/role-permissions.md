# Role Permissions

This document summarizes the role defaults in `src/constants/permissions.ts`, role hierarchy in `src/constants/roles.ts`, and additional branch scoping applied by the services. Runtime authorization is the source of truth.

## Role behavior

| Role               | Default permissions and data scope                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN`      | Full access across all branches and company records. Can manage all roles, including Admin. Receives no management email notifications.                                                                                                                                                                                                              |
| `ADMIN`            | Full access across branches and company records. Can manage roles below Admin, but cannot create or manage Super Admin or Admin accounts. Receives organization-wide management and daily-data notifications.                                                                                                                                        |
| `DIRECTOR`         | Full module defaults, but branch-specific records and dashboard branch analytics are scoped to assigned active branches. May manage users at or below Director only within the Director's own assigned branches. Can access company-wide records where the role has permission. Receives notifications for assigned branches only.                   |
| `ACCOUNTS_FINANCE` | Dashboard access; default read access to medicine and OTC sales, service sales, courses, cards, and branches; read/create/update branch expenses. Medicine and OTC sales have no default write permissions. Individual grants may add permitted actions. No company-expense defaults. Data is limited to assigned branches for branch-aware records. |
| `DATA_ENTRY`       | Create/read/update medicine and OTC sales, service sales, patient visits, and patient feedback. Limited to assigned branches.                                                                                                                                                                                                                        |
| `VIEWER_AUDITOR`   | Read-oriented access to operational records and audit history, limited to assigned branches.                                                                                                                                                                                                                                                         |

For the complete permission key list, consult `src/constants/permissions.ts` and `src/constants/roles.ts`; direct user grants are additional grants where the API permits them. Some routes also enforce role hierarchy and record scope independently of permission keys.

## Branch scope

| Roles                                              | Scope                                                                                                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN`, `ADMIN`                             | All active branches; branch assignment is not required.                                                                                                                                            |
| `DIRECTOR`                                         | Assigned active branches only for branch-specific records. Directors must have assignments. Dashboard branch analytics follow the same scope; authorized company-wide records remain company-wide. |
| `ACCOUNTS_FINANCE`, `DATA_ENTRY`, `VIEWER_AUDITOR` | Assigned active branches only; at least one active assignment is required when provisioning these roles.                                                                                           |

The authenticated profile returns the user's assigned branch IDs. Supplying a branch outside the caller's allowed scope is rejected. `COMPANY` expenses are organization-level records and are not branch-filtered; only roles with the relevant company-expense permissions can access them. Branch-level users are denied company-expense permissions even if old direct grants or token claims contain them.

## User-management hierarchy

| Acting role   | Roles it may manage                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN` | All roles.                                                                                                                                         |
| `ADMIN`       | `DIRECTOR`, `ACCOUNTS_FINANCE`, `DATA_ENTRY`, `VIEWER_AUDITOR`.                                                                                    |
| `DIRECTOR`    | `DIRECTOR`, `ACCOUNTS_FINANCE`, `DATA_ENTRY`, `VIEWER_AUDITOR`, with branch assignment constrained to the acting Director's own assigned branches. |
| Other roles   | No user-management access by default.                                                                                                              |

Only `SUPER_ADMIN` may create or manage `ADMIN` accounts. A Director cannot assign branches outside their own assignments and cannot manage Admin or Super Admin accounts. Invitations use the same hierarchy and branch restrictions as user management.

## Dashboard and workspace

`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, and `ACCOUNTS_FINANCE` can access the dashboard. Director dashboard queries are scoped to the Director's assigned branches; the dashboard's company-level aggregates continue to follow their respective permissions and data ownership. The workspace summary is a separate endpoint and does not replace dashboard access.

## Management notifications

- `ADMIN` receives eligible management notifications across all branches.
- `DIRECTOR` receives notifications only for branches assigned to that Director.
- `SUPER_ADMIN` receives no management notifications.
- Invitation acceptance, company-record deletion, role/status changes, and permission grants/revocations produce management notifications according to recipient scope. Invitation expiry notices go to the inviter.
- The daily missing-entry reminder checks whether each active branch has a `PatientVisit` and a medicine/OTC `Sale` dated today, using the configured business timezone. Admins receive the all-branch report; Directors receive only their assigned branches' report.

## Permission caveats

- Role defaults and user-specific grants are defined in code and persisted user grants; this document is descriptive, not an authorization mechanism.
- Branch scope, user hierarchy, account active/verified status, and route-level role gates can further restrict an operation.
- Company expenses and branch expenses are distinct resource families. Branch roles must not receive company-expense permissions.
- Audit viewing is role-gated for SUPER_ADMIN, ADMIN, DIRECTOR, and VIEWER_AUDITOR.
