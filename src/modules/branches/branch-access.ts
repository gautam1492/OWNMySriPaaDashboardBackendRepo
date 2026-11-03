import type { AuthUser } from "../../types/common.types.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import * as branchRepository from "./branch.repository.js";

/** Confirm the user can access an active branch. */
export async function ensureBranchAccess(user: AuthUser, branchId: string) {
    branchFilter(user, branchId);
    const branch = await branchRepository.findById(branchId);
    if (!branch || !branch.isActive) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    }
    return branch;
}
