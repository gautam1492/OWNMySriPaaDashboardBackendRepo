import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as csrFundRepository from "./csr-fund.repository.js";
import type { AuthUser, CsrFundInput, CsrFundPatchInput, RequestMeta } from "./csr-fund.types.js";

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
    if (query.month) where.month = MONTH_MAP[Number(query.month)];
    if (query.year) where.year = query.year;
    return csrFundRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await csrFundRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CsrFundInput, meta?: RequestMeta) {
    const created = await csrFundRepository.create({
        month: MONTH_MAP[input.month],
        year: input.year,
        lastMonthTotalIncome: input.lastMonthTotalIncome,
        percentage: input.percentage,
        amount: input.amount,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "CSR_FUND_CREATED",
        resourceType: "CSR_FUND",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CsrFundPatchInput,
    meta?: RequestMeta,
) {
    const found = await csrFundRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const updated = await csrFundRepository.update(id, {
        ...(input.month !== undefined ? { month: MONTH_MAP[input.month] } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.lastMonthTotalIncome !== undefined
            ? { lastMonthTotalIncome: input.lastMonthTotalIncome }
            : {}),
        ...(input.percentage !== undefined ? { percentage: input.percentage } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "CSR_FUND_UPDATED",
        resourceType: "CSR_FUND",
        resourceId: id,
        metadata: {
            month: found.month,
            year: found.year,
            amount: found.amount.toString(),
            percentage: found.percentage.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await csrFundRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await csrFundRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "CSR_FUND_DELETED",
        resourceType: "CSR_FUND",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
