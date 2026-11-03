import type { RoleName } from "@prisma/client";

export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    DIRECTOR: "DIRECTOR",
    ACCOUNTS_FINANCE: "ACCOUNTS_FINANCE",
    DATA_ENTRY: "DATA_ENTRY",
    VIEWER_AUDITOR: "VIEWER_AUDITOR",
} as const satisfies Record<string, RoleName>;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Numeric role hierarchy — higher value means more authority.
 *
 * SUPER_ADMIN (5) > ADMIN (4) > DIRECTOR (3) > ACCOUNTS_FINANCE (2) > DATA_ENTRY (1) > VIEWER_AUDITOR (0)
 */
export const ROLE_HIERARCHY = {
    SUPER_ADMIN: 5,
    ADMIN: 4,
    DIRECTOR: 3,
    ACCOUNTS_FINANCE: 2,
    DATA_ENTRY: 1,
    VIEWER_AUDITOR: 0,
} as const satisfies Record<RoleName, number>;

/**
 * Roles allowed to create/edit/delete other users.
 * DIRECTOR is included so directors can manage users at or below their hierarchy level.
 */
const USER_MANAGEMENT_ROLES: ReadonlySet<RoleName> = new Set([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
]);

export function canManageUsers(role: RoleName): boolean {
    return USER_MANAGEMENT_ROLES.has(role);
}

/**
 * Returns true when `actorRole` is allowed to manage (create/update/delete)
 * a user whose role is `targetRole`.
 *
 * Rules:
 * 1. The actor must be in a USER_MANAGEMENT role.
 * 2. The actor's hierarchy level must be >= the target's level.
 * 3. Special rule: only SUPER_ADMIN may manage users with the ADMIN role.
 */
export function canManageUserWithRole(actorRole: RoleName, targetRole: RoleName): boolean {
    if (!canManageUsers(actorRole)) return false;
    if (targetRole === ROLES.ADMIN) return actorRole === ROLES.SUPER_ADMIN;
    return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Returns the list of roles that `actorRole` is allowed to assign when
 * creating or updating a user.
 */
export function getAssignableRoles(actorRole: RoleName): RoleName[] {
    return (Object.keys(ROLE_HIERARCHY) as RoleName[]).filter((r) =>
        canManageUserWithRole(actorRole, r),
    );
}

/** Roles with organization-wide branch access. Directors are branch-scoped. */
const CROSS_BRANCH_ROLES: ReadonlySet<RoleName> = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

export function isCrossBranchRole(role: RoleName): boolean {
    return CROSS_BRANCH_ROLES.has(role);
}

/** Roles allowed to touch financial (expense) modules. */
const FINANCE_ROLES: ReadonlySet<RoleName> = new Set([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.ACCOUNTS_FINANCE,
]);

export function canAccessFinance(role: RoleName): boolean {
    return FINANCE_ROLES.has(role);
}

/** Roles allowed to write operational records. Viewers are read-only. */
const WRITER_ROLES: ReadonlySet<RoleName> = new Set([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.ACCOUNTS_FINANCE,
    ROLES.DATA_ENTRY,
]);

export function canWriteRecords(role: RoleName): boolean {
    return WRITER_ROLES.has(role);
}

/** Only Super Admin and Admin may delete master records. */
export function canDeleteRecords(role: RoleName): boolean {
    return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}
