import type { Prisma } from "@prisma/client";
import * as auditRepository from "./audit.repository.js";
import type { AuditInput, AuditListQuery } from "./audit.types.js";
import { logger } from "../../config/logger.js";
import { safeErrorMetadata } from "../../utils/safeError.js";
import { notifyManagementForAudit } from "./management-notification.service.js";

export async function writeAudit(input: AuditInput) {
    await auditRepository.create({
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
    });
    try {
        await notifyManagementForAudit(input);
    } catch (error) {
        logger.error(
            { ...safeErrorMetadata(error), action: input.action },
            "Management notification failed",
        );
    }
}

export async function listAudits(query: AuditListQuery) {
    const where: Prisma.AuditLogWhereInput = {
        ...(query.action ? { action: { contains: query.action } } : {}),
        ...(query.resourceType ? { resourceType: query.resourceType } : {}),
        ...(query.resourceId ? { resourceId: query.resourceId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.search
            ? {
                  OR: [
                      { action: { contains: query.search } },
                      { resourceType: { contains: query.search } },
                      { resourceId: { contains: query.search } },
                  ],
              }
            : {}),
    };
    return auditRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function auditFilterOptions() {
    return auditRepository.listFilterOptions();
}
