import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function create(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.auditLog.create({ data });
}

export async function list(params: {
    where: Prisma.AuditLogWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
            where: params.where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.auditLog.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function listFilterOptions() {
    const [actions, resourceTypes] = await Promise.all([
        prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
        prisma.auditLog.groupBy({ by: ["resourceType"], orderBy: { resourceType: "asc" } }),
    ]);
    return {
        actions: actions.map(({ action }) => action),
        resourceTypes: resourceTypes.map(({ resourceType }) => resourceType),
    };
}
