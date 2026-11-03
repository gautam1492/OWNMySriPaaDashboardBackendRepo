import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as loanRepository from "./loan.repository.js";
import type { AuthUser, LoanInput, LoanPatchInput, RequestMeta } from "./loan.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.search) {
        where.name = { contains: query.search };
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }
    return loanRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await loanRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: LoanInput, meta?: RequestMeta) {
    const created = await loanRepository.create({
        name: input.name,
        originalAmount: input.originalAmount,
        isActive: input.isActive ?? true,
    });
    await writeAudit({
        userId: user.id,
        action: "LOAN_CREATED",
        resourceType: "LOAN",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: LoanPatchInput,
    meta?: RequestMeta,
) {
    const found = await loanRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    if (
        input.originalAmount !== undefined &&
        input.originalAmount < found.originalAmount - found.outstandingAmount
    ) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Original loan amount cannot be lower than the amount already repaid.",
        );
    }
    const updated = await loanRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.originalAmount !== undefined ? { originalAmount: input.originalAmount } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "LOAN_UPDATED",
        resourceType: "LOAN",
        resourceId: id,
        metadata: {
            name: found.name,
            originalAmount: found.originalAmount.toString(),
            outstandingAmount: found.outstandingAmount,
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await loanRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await loanRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "LOAN_DELETED",
        resourceType: "LOAN",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
