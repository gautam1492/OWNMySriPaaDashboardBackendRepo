import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import { calculateTaxTotals } from "./tax-totals.js";
import * as otherExpenseRepository from "./other-expense.repository.js";
import type {
    AuthUser,
    OtherExpenseInput,
    OtherExpensePatchInput,
    RequestMeta,
} from "./other-expense.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.year) where.year = query.year;
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
    return otherExpenseRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await otherExpenseRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: OtherExpenseInput, meta?: RequestMeta) {
    const taxTotals = calculateTaxTotals(input.price, input.gst, input.sgst);
    const created = await otherExpenseRepository.create({
        itemName: input.itemName,
        invoiceId: input.invoiceId,
        price: input.price,
        billingDate: asDate(input.billingDate),
        paymentDate: asDate(input.paymentDate),
        gst: input.gst,
        sgst: input.sgst,
        ...taxTotals,
        year: input.year,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "OTHER_EXPENSE_CREATED",
        resourceType: "OTHER_EXPENSE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: OtherExpensePatchInput,
    meta?: RequestMeta,
) {
    const found = await otherExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const price = input.price ?? Number(found.price);
    const gst = input.gst ?? Number(found.gst);
    const sgst = input.sgst ?? Number(found.sgst);
    const updated = await otherExpenseRepository.update(id, {
        ...(input.itemName !== undefined ? { itemName: input.itemName } : {}),
        ...(input.invoiceId !== undefined ? { invoiceId: input.invoiceId } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.billingDate ? { billingDate: asDate(input.billingDate) } : {}),
        ...(input.paymentDate ? { paymentDate: asDate(input.paymentDate) } : {}),
        ...(input.gst !== undefined ? { gst: input.gst } : {}),
        ...(input.sgst !== undefined ? { sgst: input.sgst } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...calculateTaxTotals(price, gst, sgst),
    });
    await writeAudit({
        userId: user.id,
        action: "OTHER_EXPENSE_UPDATED",
        resourceType: "OTHER_EXPENSE",
        resourceId: id,
        metadata: {
            itemName: found.itemName,
            invoiceId: found.invoiceId,
            paymentDate: found.paymentDate.toISOString().slice(0, 10),
            totalAmount: found.totalAmount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await otherExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await otherExpenseRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "OTHER_EXPENSE_DELETED",
        resourceType: "OTHER_EXPENSE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
