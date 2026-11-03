import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as branchRepository from "./branch.repository.js";
import type { CreateBranchInput } from "./branch.types.js";
import type { RequestMeta } from "../../types/common.types.js";
import type { AuthUser } from "../../types/common.types.js";
import { isCrossBranchRole } from "../../constants/roles.js";

function auditMeta(actorId: string, meta?: RequestMeta) {
    return { userId: actorId, ipAddress: meta?.ip, userAgent: meta?.userAgent };
}

export async function listActive(user: AuthUser) {
    return isCrossBranchRole(user.role)
        ? branchRepository.findActiveMany()
        : branchRepository.findActiveByIds(user.branchIds);
}

export async function create(input: CreateBranchInput) {
    return branchRepository.create(input);
}

export async function getActiveById(id: string) {
    const branch = await branchRepository.findById(id);
    if (!branch || !branch.isActive) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.BRANCH_INACTIVE);
    }
    return branch;
}

export async function deleteBranch(actorId: string, id: string, meta?: RequestMeta) {
    const existing = await branchRepository.findById(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await branchRepository.remove(id);
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "BRANCH_DELETED",
        resourceType: "BRANCH",
        resourceId: id,
        metadata: { name: existing.name, code: existing.code },
    });
}
