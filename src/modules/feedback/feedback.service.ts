import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import * as feedbackRepository from "./feedback.repository.js";
import type {
    AuthUser,
    FeedbackInput,
    FeedbackListQuery,
    FeedbackPatchInput,
    RequestMeta,
} from "./feedback.types.js";

export async function list(user: AuthUser, query: FeedbackListQuery) {
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
    return feedbackRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function create(user: AuthUser, input: FeedbackInput, meta?: RequestMeta) {
    await ensureBranchAccess(user, input.branchId);
    const created = await feedbackRepository.create({
        ...input,
        date: asDate(input.date),
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "FEEDBACK_CREATED",
        resourceType: "FEEDBACK",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(user: AuthUser, id: string, input: FeedbackPatchInput) {
    const found = await feedbackRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.FEEDBACK_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    return feedbackRepository.update(found.id, {
        ...input,
        ...(input.date ? { date: asDate(input.date) } : {}),
        updatedById: user.id,
    });
}

export async function deleteFeedback(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await feedbackRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.FEEDBACK_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    await feedbackRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "FEEDBACK_DELETED",
        resourceType: "FEEDBACK",
        resourceId: id,
        metadata: { branchId: found.branchId },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
