import type { RoleName } from "@prisma/client";
import type { PermissionKey } from "../constants/permissions.js";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    roleId: string;
    role: RoleName;
    /** Branch IDs this user is assigned to. Empty for organization-wide roles (SUPER_ADMIN, ADMIN). */
    branchIds: string[];
    /** Effective permission keys: role defaults + granted extras. */
    permissions: PermissionKey[];
};

export type RequestMeta = {
    ip?: string;
    userAgent?: string;
};

export type PaginationQuery = {
    page: number;
    limit: number;
};

export type DateRangeQuery = {
    startDate?: string;
    endDate?: string;
};
