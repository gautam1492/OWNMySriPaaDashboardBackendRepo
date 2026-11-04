import { describe, expect, it } from "vitest";
import {
    canManageUserWithRole,
    getAssignableRoles,
    ROLES,
    ROLE_HIERARCHY,
} from "../../src/constants/roles.js";
import { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "../../src/constants/permissions.js";
import { branchFilter } from "../../src/utils/branchScope.js";

describe("role hierarchy", () => {
    it("ranks roles in descending authority", () => {
        expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(5);
        expect(ROLE_HIERARCHY.ADMIN).toBe(4);
        expect(ROLE_HIERARCHY.DIRECTOR).toBe(3);
        expect(ROLE_HIERARCHY.ACCOUNTS_FINANCE).toBe(2);
        expect(ROLE_HIERARCHY.DATA_ENTRY).toBe(1);
        expect(ROLE_HIERARCHY.VIEWER_AUDITOR).toBe(0);
    });

    it("lets SUPER_ADMIN manage every role including ADMIN", () => {
        expect(canManageUserWithRole(ROLES.SUPER_ADMIN, ROLES.ADMIN)).toBe(true);
        expect(canManageUserWithRole(ROLES.SUPER_ADMIN, ROLES.DIRECTOR)).toBe(true);
        expect(canManageUserWithRole(ROLES.SUPER_ADMIN, ROLES.VIEWER_AUDITOR)).toBe(true);
    });

    it("lets ADMIN manage DIRECTOR and below, but not ADMIN", () => {
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.DIRECTOR)).toBe(true);
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.ACCOUNTS_FINANCE)).toBe(true);
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.DATA_ENTRY)).toBe(true);
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.VIEWER_AUDITOR)).toBe(true);
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false); // only SUPER_ADMIN
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.SUPER_ADMIN)).toBe(false);
    });

    it("lets DIRECTOR manage DIRECTOR and below, but not ADMIN or SUPER_ADMIN", () => {
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.DIRECTOR)).toBe(true);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.ACCOUNTS_FINANCE)).toBe(true);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.DATA_ENTRY)).toBe(true);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.VIEWER_AUDITOR)).toBe(true);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.ADMIN)).toBe(false);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.SUPER_ADMIN)).toBe(false);
    });

    it("prevents lower roles from managing higher roles", () => {
        expect(canManageUserWithRole(ROLES.DATA_ENTRY, ROLES.DIRECTOR)).toBe(false);
        expect(canManageUserWithRole(ROLES.VIEWER_AUDITOR, ROLES.ADMIN)).toBe(false);
    });

    it("returns assignable roles per actor", () => {
        const superAdminAssignable = getAssignableRoles(ROLES.SUPER_ADMIN);
        expect(superAdminAssignable).toContain(ROLES.ADMIN);
        expect(superAdminAssignable).toContain(ROLES.DIRECTOR);

        const adminAssignable = getAssignableRoles(ROLES.ADMIN);
        expect(adminAssignable).toContain(ROLES.DIRECTOR);
        expect(adminAssignable).not.toContain(ROLES.ADMIN);
        expect(adminAssignable).not.toContain(ROLES.SUPER_ADMIN);

        const directorAssignable = getAssignableRoles(ROLES.DIRECTOR);
        expect(directorAssignable).toContain(ROLES.DIRECTOR);
        expect(directorAssignable).toContain(ROLES.ACCOUNTS_FINANCE);
        expect(directorAssignable).not.toContain(ROLES.ADMIN);
    });
});

describe("permission constants", () => {
    it("defines permission keys for all modules", () => {
        expect(PERMISSIONS.USERS_CREATE).toBe("users.create");
        expect(PERMISSIONS.USERS_READ).toBe("users.read");
        expect(PERMISSIONS.BRANCHES_CREATE).toBe("branches.create");
        expect(PERMISSIONS.SALES_UPDATE).toBe("sales.update");
        expect(PERMISSIONS.VISITS_DELETE).toBe("visits.delete");
    });

    it("gives DIRECTOR the full ADMIN permission set by default", () => {
        expect([...ROLE_DEFAULT_PERMISSIONS.DIRECTOR!]).toEqual([
            ...ROLE_DEFAULT_PERMISSIONS.ADMIN!,
        ]);
    });

    it("gives ACCOUNTS_FINANCE read-only medicine/OTC sales and writable branch expenses", () => {
        const financePermissions = ROLE_DEFAULT_PERMISSIONS.ACCOUNTS_FINANCE!;
        const expectedDefaults = [
            PERMISSIONS.WORKSPACE_READ,
            PERMISSIONS.BRANCHES_READ,
            PERMISSIONS.SALES_READ,
            PERMISSIONS.SERVICE_SALES_READ,
            PERMISSIONS.COURSES_READ,
            PERMISSIONS.CARDS_READ,
            PERMISSIONS.BRANCH_EXPENSES_READ,
            PERMISSIONS.BRANCH_EXPENSES_CREATE,
            PERMISSIONS.BRANCH_EXPENSES_UPDATE,
        ];
        expect([...financePermissions].sort()).toEqual([...expectedDefaults].sort());
        expect(financePermissions).not.toContain(PERMISSIONS.SALES_CREATE);
        expect(financePermissions).not.toContain(PERMISSIONS.SALES_UPDATE);
        expect(financePermissions).not.toContain(PERMISSIONS.VISITS_READ);
        expect(financePermissions).not.toContain(PERMISSIONS.FEEDBACK_READ);
        expect(financePermissions).not.toContain(PERMISSIONS.DIRECTORS_READ);
    });

    it("keeps DIRECTOR out of ADMIN and SUPER_ADMIN accounts despite holding users.delete", () => {
        expect(ROLE_DEFAULT_PERMISSIONS.DIRECTOR).toContain(PERMISSIONS.USERS_DELETE);
        // Hierarchy is the guardrail: users.delete never applies to higher roles.
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.ADMIN)).toBe(false);
        expect(canManageUserWithRole(ROLES.DIRECTOR, ROLES.SUPER_ADMIN)).toBe(false);
        // Only SUPER_ADMIN may manage an ADMIN user.
        expect(canManageUserWithRole(ROLES.SUPER_ADMIN, ROLES.ADMIN)).toBe(true);
        expect(canManageUserWithRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
    });
});

describe("branchScope", () => {
    const multiBranchDirector = {
        id: "d1",
        name: "Director",
        email: "d@x.local",
        roleId: "r1",
        branchIds: [],
        permissions: [],
        role: "DIRECTOR" as const,
    };

    const singleBranchStaff = {
        id: "s1",
        name: "Staff",
        email: "s@x.local",
        roleId: "r2",
        branchIds: ["b1"],
        permissions: [],
        role: "DATA_ENTRY" as const,
    };

    it("lets director access all branches without branch assignments", () => {
        expect(branchFilter(multiBranchDirector)).toEqual({});
        expect(branchFilter(multiBranchDirector, "b9")).toEqual({ branchId: "b9" });
    });

    it("pins single-branch staff to their branch", () => {
        expect(branchFilter(singleBranchStaff)).toEqual({ branchId: "b1" });
        expect(branchFilter(singleBranchStaff, "b1")).toEqual({ branchId: "b1" });
        expect(() => branchFilter(singleBranchStaff, "other")).toThrow();
    });

    it("rejects branch-scoped users with no assigned branches", () => {
        const unassignedStaff = { ...singleBranchStaff, branchIds: [] };
        let thrown: unknown;
        try {
            branchFilter(unassignedStaff);
        } catch (error) {
            thrown = error;
        }
        expect(thrown).toMatchObject({ statusCode: 403 });
    });
});
