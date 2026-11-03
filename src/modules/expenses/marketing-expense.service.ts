import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import { calculateTaxTotals } from "./tax-totals.js";
import * as marketingExpenseRepository from "./marketing-expense.repository.js";
import type {
    AuthUser,
    MarketingExpenseInput,
    MarketingExpensePatchInput,
    RequestMeta,
} from "./marketing-expense.types.js";

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
    if (query.expenseMonth) where.expenseMonth = query.expenseMonth;
    if (query.expenseYear) where.expenseYear = query.expenseYear;
    if (query.startDate || query.endDate || query.paymentStartDate || query.paymentEndDate) {
        where.paymentDate = {
            ...((query.paymentStartDate ?? query.startDate)
                ? { gte: asDate(query.paymentStartDate ?? query.startDate) }
                : {}),
            ...((query.paymentEndDate ?? query.endDate)
                ? { lte: asDate(query.paymentEndDate ?? query.endDate) }
                : {}),
        };
    }
    if (query.billingStartDate || query.billingEndDate) {
        where.billingDate = {
            ...(query.billingStartDate ? { gte: asDate(query.billingStartDate) } : {}),
            ...(query.billingEndDate ? { lte: asDate(query.billingEndDate) } : {}),
        };
    }
    return marketingExpenseRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await marketingExpenseRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: MarketingExpenseInput, meta?: RequestMeta) {
    const taxTotals = calculateTaxTotals(input.price, input.gst, input.sgst);
    const created = await marketingExpenseRepository.create({
        companyName: input.companyName,
        invoiceId: input.invoiceId,
        price: input.price,
        billingDate: asDate(input.billingDate),
        paymentDate: asDate(input.paymentDate),
        gst: input.gst,
        sgst: input.sgst,
        ...taxTotals,
        expenseMonth: MONTH_MAP[input.expenseMonth],
        expenseYear: input.expenseYear,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "MARKETING_EXPENSE_CREATED",
        resourceType: "MARKETING_EXPENSE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: MarketingExpensePatchInput,
    meta?: RequestMeta,
) {
    const found = await marketingExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const price = input.price ?? Number(found.price);
    const gst = input.gst ?? Number(found.gst);
    const sgst = input.sgst ?? Number(found.sgst);
    const updated = await marketingExpenseRepository.update(id, {
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.invoiceId !== undefined ? { invoiceId: input.invoiceId } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.billingDate ? { billingDate: asDate(input.billingDate) } : {}),
        ...(input.paymentDate ? { paymentDate: asDate(input.paymentDate) } : {}),
        ...(input.gst !== undefined ? { gst: input.gst } : {}),
        ...(input.sgst !== undefined ? { sgst: input.sgst } : {}),
        ...(input.expenseMonth !== undefined
            ? { expenseMonth: MONTH_MAP[input.expenseMonth] }
            : {}),
        ...(input.expenseYear !== undefined ? { expenseYear: input.expenseYear } : {}),
        ...calculateTaxTotals(price, gst, sgst),
    });
    await writeAudit({
        userId: user.id,
        action: "MARKETING_EXPENSE_UPDATED",
        resourceType: "MARKETING_EXPENSE",
        resourceId: id,
        metadata: {
            companyName: found.companyName,
            invoiceId: found.invoiceId,
            expenseMonth: found.expenseMonth,
            expenseYear: found.expenseYear,
            totalAmount: found.totalAmount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await marketingExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await marketingExpenseRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "MARKETING_EXPENSE_DELETED",
        resourceType: "MARKETING_EXPENSE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
