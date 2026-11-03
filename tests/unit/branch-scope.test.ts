import { describe, expect, it } from "vitest";
import { branchFilter } from "../../src/utils/branchScope.js";
import { getRequestMeta } from "../../src/utils/requestMeta.js";

describe("branchScope", () => {
    const admin = {
        id: "1",
        name: "Admin",
        email: "a@x.local",
        roleId: "r1",
        branchIds: [],
        permissions: [],
        role: "ADMIN" as const,
    };
    const staff = {
        id: "2",
        name: "Staff",
        email: "s@x.local",
        roleId: "r2",
        branchIds: ["b1"],
        permissions: [],
        role: "DATA_ENTRY" as const,
    };

    it("lets admin scope optionally by branch", () => {
        expect(branchFilter(admin)).toEqual({});
        expect(branchFilter(admin, "b9")).toEqual({ branchId: "b9" });
    });

    it("pins non-admin users to their branch", () => {
        expect(branchFilter(staff)).toEqual({ branchId: "b1" });
        expect(branchFilter(staff, "b1")).toEqual({ branchId: "b1" });
        expect(() => branchFilter(staff, "other")).toThrow();
    });

    it("forbids branch-scoped users with no branch assignments", () => {
        expect(() => branchFilter({ ...staff, branchIds: [] })).toThrow(
            "Your account is not assigned to a branch",
        );
    });

    it("builds request metadata for audit logging", () => {
        const req = { ip: "127.0.0.1", get: () => "vitest" } as never;
        expect(getRequestMeta(req as never)).toEqual({ ip: "127.0.0.1", userAgent: "vitest" });
    });
});
