import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as loanRepository from "./loan.repository.js";
import * as loanRepaymentRepository from "./loan-repayment.repository.js";
import type {
    AuthUser,
    LoanRepaymentInput,
    LoanRepaymentPatchInput,
    RequestMeta,
} from "./loan-repayment.types.js";

const MONTH_MAP: Record<
    number,
    | "JANUARY"
    | "FEBRUARY"
    | "MARCH"
    | "APRIL"
    | "MAY"
    | "JUNE"
    | "JULY"
    | "AUGUST"
    | "SEPTEMBER"
    | "OCTOBER"
    | "NOVEMBER"
    | "DECEMBER"
> = {
    1: "JANUARY",
    2: "FEBRUARY",
    3: "MARCH",
    4: "APRIL",
    5: "MAY",
    6: "JUNE",
    7: "JULY",
    8: "AUGUST",
    9: "SEPTEMBER",
    10: "OCTOBER",
    11: "NOVEMBER",
    12: "DECEMBER",
};

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.loanId) where.loanId = query.loanId;
    if (query.month) where.month = MONTH_MAP[Number(query.month)];
    if (query.year) where.year = query.year;
    return loanRepaymentRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await loanRepaymentRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: LoanRepaymentInput, meta?: RequestMeta) {
    const loan = await loanRepository.findById(input.loanId);
    if (!loan) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    if (input.repaymentAmount > loan.outstandingAmount) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Repayment amount exceeds the loan's outstanding balance.",
        );
    }
    const created = await loanRepaymentRepository.create({
        loanId: input.loanId,
        month: MONTH_MAP[input.month],
        year: input.year,
        repaymentAmount: input.repaymentAmount,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "LOAN_REPAYMENT_CREATED",
        resourceType: "LOAN_REPAYMENT",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: LoanRepaymentPatchInput,
    meta?: RequestMeta,
) {
    const found = await loanRepaymentRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const loanId = input.loanId ?? found.loanId;
    const loan = await loanRepository.findById(loanId);
    if (!loan) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const currentRepayment = found.loanId === loanId ? Number(found.repaymentAmount) : 0;
    const availableBalance = loan.outstandingAmount + currentRepayment;
    const repaymentAmount = input.repaymentAmount ?? Number(found.repaymentAmount);
    if (repaymentAmount > availableBalance) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Repayment amount exceeds the loan's outstanding balance.",
        );
    }
    const updated = await loanRepaymentRepository.update(id, {
        ...(input.loanId !== undefined ? { loanId: input.loanId } : {}),
        ...(input.month !== undefined ? { month: MONTH_MAP[input.month] } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.repaymentAmount !== undefined ? { repaymentAmount: input.repaymentAmount } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "LOAN_REPAYMENT_UPDATED",
        resourceType: "LOAN_REPAYMENT",
        resourceId: id,
        metadata: {
            loanName: found.loan.name,
            month: found.month,
            year: found.year,
            repaymentAmount: found.repaymentAmount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await loanRepaymentRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await loanRepaymentRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "LOAN_REPAYMENT_DELETED",
        resourceType: "LOAN_REPAYMENT",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
