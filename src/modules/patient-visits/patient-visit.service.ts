import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import * as visitRepository from "./patient-visit.repository.js";
import type {
    AuthUser,
    RequestMeta,
    VisitInput,
    VisitListQuery,
    VisitPatchInput,
} from "./patient-visit.types.js";

export async function list(user: AuthUser, query: VisitListQuery) {
    const branch = branchFilter(user, query.branchId);
    const where = {
        ...branch,
        ...(query.startDate || query.endDate
            ? {
                  date: {
                      ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
                      ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
                  },
              }
            : {}),
    };
    return visitRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function create(user: AuthUser, input: VisitInput, meta?: RequestMeta) {
    await ensureBranchAccess(user, input.branchId);
    const created = await visitRepository.create({
        ...input,
        date: asDate(input.date),
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "PATIENT_VISIT_CREATED",
        resourceType: "PATIENT_VISIT",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(user: AuthUser, id: string, input: VisitPatchInput) {
    const found = await visitRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.PATIENT_VISIT_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    return visitRepository.update(found.id, {
        ...input,
        ...(input.date ? { date: asDate(input.date) } : {}),
        updatedById: user.id,
    });
}

export async function deleteVisit(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await visitRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.PATIENT_VISIT_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    await visitRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "PATIENT_VISIT_DELETED",
        resourceType: "PATIENT_VISIT",
        resourceId: id,
        metadata: { branchId: found.branchId },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
