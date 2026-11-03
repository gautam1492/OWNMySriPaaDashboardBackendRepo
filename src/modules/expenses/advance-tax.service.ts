import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as advanceTaxRepository from "./advance-tax.repository.js";
import type {
    AuthUser,
    AdvanceTaxInput,
    AdvanceTaxPatchInput,
    RequestMeta,
} from "./advance-tax.types.js";

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
    return advanceTaxRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await advanceTaxRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: AdvanceTaxInput, meta?: RequestMeta) {
    const created = await advanceTaxRepository.create({
        month: MONTH_MAP[input.month],
        year: input.year,
        amountPaid: input.amountPaid,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "ADVANCE_TAX_CREATED",
        resourceType: "ADVANCE_TAX",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: AdvanceTaxPatchInput,
    meta?: RequestMeta,
) {
    const found = await advanceTaxRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const updated = await advanceTaxRepository.update(id, {
        ...(input.month !== undefined ? { month: MONTH_MAP[input.month] } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "ADVANCE_TAX_UPDATED",
        resourceType: "ADVANCE_TAX",
        resourceId: id,
        metadata: {
            month: found.month,
            year: found.year,
            amountPaid: found.amountPaid.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await advanceTaxRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await advanceTaxRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "ADVANCE_TAX_DELETED",
        resourceType: "ADVANCE_TAX",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
