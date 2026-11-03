import type { AuthUser } from "../types/common.types.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { isCrossBranchRole } from "../constants/roles.js";
import { ApiError } from "./ApiError.js";

/** Build a branch filter; reject branch-scoped users with no assignment or an out-of-scope branch. */
export function branchFilter(user: AuthUser, requestedBranchId?: string) {
    if (isCrossBranchRole(user.role)) {
        return requestedBranchId ? { branchId: requestedBranchId } : {};
    }

    const branchIds = user.branchIds;
    if (!branchIds || branchIds.length === 0) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.BRANCH_NOT_ASSIGNED);
    }

    if (requestedBranchId) {
        if (!branchIds.includes(requestedBranchId)) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.BRANCH_ACCESS_DENIED);
        }
        return { branchId: requestedBranchId };
    }

    // Single-branch users keep the simple equality filter for index efficiency.
    if (branchIds.length === 1) {
        return { branchId: branchIds[0]! };
    }
    return { branchId: { in: branchIds } };
}
