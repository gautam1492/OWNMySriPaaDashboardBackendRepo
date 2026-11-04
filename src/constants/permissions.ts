/** Permission keys use the `{module}.{action}` format. */
export const PERMISSIONS = {
    // ── Users module ─────────────────────────────────────────────────────
    USERS_READ: "users.read",
    USERS_CREATE: "users.create",
    USERS_UPDATE: "users.update",
    USERS_DELETE: "users.delete",

    // ── Branches module ──────────────────────────────────────────────────
    BRANCHES_READ: "branches.read",
    BRANCHES_CREATE: "branches.create",
    BRANCHES_UPDATE: "branches.update",
    BRANCHES_DELETE: "branches.delete",

    // ── Items module ─────────────────────────────────────────────────────
    ITEMS_READ: "items.read",
    ITEMS_CREATE: "items.create",
    ITEMS_UPDATE: "items.update",
    ITEMS_DELETE: "items.delete",

    // ── Services module ──────────────────────────────────────────────────
    SERVICES_READ: "services.read",
    SERVICES_CREATE: "services.create",
    SERVICES_UPDATE: "services.update",
    SERVICES_DELETE: "services.delete",

    // ── Sales module ─────────────────────────────────────────────────────
    SALES_READ: "sales.read",
    SALES_CREATE: "sales.create",
    SALES_UPDATE: "sales.update",
    SALES_DELETE: "sales.delete",

    // ── Service sales module ─────────────────────────────────────────────
    SERVICE_SALES_READ: "serviceSales.read",
    SERVICE_SALES_CREATE: "serviceSales.create",
    SERVICE_SALES_UPDATE: "serviceSales.update",
    SERVICE_SALES_DELETE: "serviceSales.delete",

    // ── Patient Visits module ────────────────────────────────────────────
    VISITS_READ: "visits.read",
    VISITS_CREATE: "visits.create",
    VISITS_UPDATE: "visits.update",
    VISITS_DELETE: "visits.delete",

    // ── Feedback module ──────────────────────────────────────────────────
    FEEDBACK_READ: "feedback.read",
    FEEDBACK_CREATE: "feedback.create",
    FEEDBACK_UPDATE: "feedback.update",
    FEEDBACK_DELETE: "feedback.delete",

    // ── Courses module ─────────────────────────────────────────────────────
    COURSES_READ: "courses.read",
    COURSES_CREATE: "courses.create",
    COURSES_UPDATE: "courses.update",
    COURSES_DELETE: "courses.delete",

    // ── Cards module ───────────────────────────────────────────────────────
    CARDS_READ: "cards.read",
    CARDS_CREATE: "cards.create",
    CARDS_UPDATE: "cards.update",
    CARDS_DELETE: "cards.delete",

    // ── Expenses module ────────────────────────────────────────────────────
    CORE_INVESTMENTS_READ: "coreInvestments.read",
    CORE_INVESTMENTS_CREATE: "coreInvestments.create",
    CORE_INVESTMENTS_UPDATE: "coreInvestments.update",
    CORE_INVESTMENTS_DELETE: "coreInvestments.delete",

    MEDICINE_PURCHASES_READ: "medicinePurchases.read",
    MEDICINE_PURCHASES_CREATE: "medicinePurchases.create",
    MEDICINE_PURCHASES_UPDATE: "medicinePurchases.update",
    MEDICINE_PURCHASES_DELETE: "medicinePurchases.delete",

    MARKETING_EXPENSES_READ: "marketingExpenses.read",
    MARKETING_EXPENSES_CREATE: "marketingExpenses.create",
    MARKETING_EXPENSES_UPDATE: "marketingExpenses.update",
    MARKETING_EXPENSES_DELETE: "marketingExpenses.delete",

    CSR_FUNDS_READ: "csrFunds.read",
    CSR_FUNDS_CREATE: "csrFunds.create",
    CSR_FUNDS_UPDATE: "csrFunds.update",
    CSR_FUNDS_DELETE: "csrFunds.delete",

    LOAN_REPAYMENTS_READ: "loanRepayments.read",
    LOAN_REPAYMENTS_CREATE: "loanRepayments.create",
    LOAN_REPAYMENTS_UPDATE: "loanRepayments.update",
    LOAN_REPAYMENTS_DELETE: "loanRepayments.delete",

    ADVANCE_TAXES_READ: "advanceTaxes.read",
    ADVANCE_TAXES_CREATE: "advanceTaxes.create",
    ADVANCE_TAXES_UPDATE: "advanceTaxes.update",
    ADVANCE_TAXES_DELETE: "advanceTaxes.delete",

    OTHER_EXPENSES_READ: "otherExpenses.read",
    OTHER_EXPENSES_CREATE: "otherExpenses.create",
    OTHER_EXPENSES_UPDATE: "otherExpenses.update",
    OTHER_EXPENSES_DELETE: "otherExpenses.delete",

    DIRECTOR_SALARIES_READ: "directorSalaries.read",
    DIRECTOR_SALARIES_CREATE: "directorSalaries.create",
    DIRECTOR_SALARIES_UPDATE: "directorSalaries.update",
    DIRECTOR_SALARIES_DELETE: "directorSalaries.delete",

    MISCELLANEOUS_EXPENSES_READ: "miscellaneousExpenses.read",
    MISCELLANEOUS_EXPENSES_CREATE: "miscellaneousExpenses.create",
    MISCELLANEOUS_EXPENSES_UPDATE: "miscellaneousExpenses.update",
    MISCELLANEOUS_EXPENSES_DELETE: "miscellaneousExpenses.delete",

    BRANCH_EXPENSES_READ: "branchExpenses.read",
    BRANCH_EXPENSES_CREATE: "branchExpenses.create",
    BRANCH_EXPENSES_UPDATE: "branchExpenses.update",
    BRANCH_EXPENSES_DELETE: "branchExpenses.delete",

    // ── Loans module ──────────────────────────────────────────────────────
    LOANS_READ: "loans.read",
    LOANS_CREATE: "loans.create",
    LOANS_UPDATE: "loans.update",
    LOANS_DELETE: "loans.delete",

    // Legacy permission keys retained for compatibility; director identities now come from users.
    DIRECTORS_READ: "directors.read",
    DIRECTORS_CREATE: "directors.create",
    DIRECTORS_UPDATE: "directors.update",
    DIRECTORS_DELETE: "directors.delete",

    WORKSPACE_READ: "workspace.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const COMPANY_FINANCE_PERMISSION_PREFIXES = [
    "coreInvestments.",
    "medicinePurchases.",
    "marketingExpenses.",
    "csrFunds.",
    "loans.",
    "loanRepayments.",
    "advanceTaxes.",
    "otherExpenses.",
    "directorSalaries.",
    "miscellaneousExpenses.",
] as const;

export function isCompanyFinancePermissionKey(key: string) {
    return COMPANY_FINANCE_PERMISSION_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Directors retain assigned-branch data scope, but can access company-wide finance
 * and unscoped course/card sales as explicitly authorized for this role. */
export function isPermissionAllowedForRole(role: string, key: string) {
    if (role === "DIRECTOR" || role === "SUPER_ADMIN" || role === "ADMIN") return true;
    return !isCompanyFinancePermissionKey(key);
}

export function effectiveRolePermissions(role: string): PermissionKey[] {
    return (ROLE_DEFAULT_PERMISSIONS[role] ?? []).filter((key) =>
        isPermissionAllowedForRole(role, key),
    );
}

/** All modules that expose permissions. */
export const MODULES = [
    "users",
    "branches",
    "items",
    "services",
    "sales",
    "serviceSales",
    "visits",
    "feedback",
    "courses",
    "cards",
    "coreInvestments",
    "medicinePurchases",
    "marketingExpenses",
    "csrFunds",
    "loanRepayments",
    "advanceTaxes",
    "otherExpenses",
    "directorSalaries",
    "miscellaneousExpenses",
    "branchExpenses",
    "directors",
    "loans",
] as const;

export type ModuleName = (typeof MODULES)[number];

/** All actions available on every module. */
export const ACTIONS = ["read", "create", "update", "delete"] as const;
export type PermissionAction = (typeof ACTIONS)[number];

/** Role defaults; saved UserPermission grants are added to these at sign-in. */
export const ROLE_DEFAULT_PERMISSIONS: Readonly<Record<string, readonly PermissionKey[]>> = {
    SUPER_ADMIN: Object.values(PERMISSIONS),

    ADMIN: Object.values(PERMISSIONS),

    DIRECTOR: [
        // Directors share Admin defaults but cannot manage Admin or Super Admin users.
        ...Object.values(PERMISSIONS),
    ],

    ACCOUNTS_FINANCE: [
        PERMISSIONS.WORKSPACE_READ,
        // Branches: read-only
        PERMISSIONS.BRANCHES_READ,
        // Read-only access to medicine/OTC sales.
        PERMISSIONS.SALES_READ,
        PERMISSIONS.SERVICE_SALES_READ,
        PERMISSIONS.COURSES_READ,
        PERMISSIONS.CARDS_READ,
        // Branch expenses are writable; deletion remains reserved for managers.
        PERMISSIONS.BRANCH_EXPENSES_READ,
        PERMISSIONS.BRANCH_EXPENSES_CREATE,
        PERMISSIONS.BRANCH_EXPENSES_UPDATE,
    ],

    DATA_ENTRY: [
        PERMISSIONS.WORKSPACE_READ,
        // Record entry plus read/update access for assigned-branch operations.
        PERMISSIONS.SALES_READ,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.SALES_UPDATE,
        PERMISSIONS.SERVICE_SALES_READ,
        PERMISSIONS.SERVICE_SALES_CREATE,
        PERMISSIONS.SERVICE_SALES_UPDATE,
        PERMISSIONS.VISITS_READ,
        PERMISSIONS.VISITS_CREATE,
        PERMISSIONS.VISITS_UPDATE,
        PERMISSIONS.FEEDBACK_READ,
        PERMISSIONS.FEEDBACK_CREATE,
        PERMISSIONS.FEEDBACK_UPDATE,
    ],

    VIEWER_AUDITOR: [
        PERMISSIONS.WORKSPACE_READ,
        // Read-only access to the listed operational modules.
        PERMISSIONS.USERS_READ,
        PERMISSIONS.BRANCHES_READ,
        PERMISSIONS.ITEMS_READ,
        PERMISSIONS.SERVICES_READ,
        PERMISSIONS.SALES_READ,
        PERMISSIONS.SERVICE_SALES_READ,
        PERMISSIONS.VISITS_READ,
        PERMISSIONS.FEEDBACK_READ,
    ],
};
