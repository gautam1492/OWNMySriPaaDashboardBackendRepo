import type { z } from "zod";
import type { AuthUser } from "../../types/common.types.js";
import type { auditListQuery } from "./audit.validator.js";

export type AuditInput = {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
};

export type AuditListQuery = z.infer<typeof auditListQuery>;
export type { AuthUser };
