import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import { calculateTaxTotals } from "./tax-totals.js";
import * as miscellaneousExpenseRepository from "./miscellaneous-expense.repository.js";
import type {
    AuthUser,
    MiscellaneousExpenseInput,
    MiscellaneousExpensePatchInput,
    RequestMeta,
} from "./miscellaneous-expense.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.startDate || query.endDate) {
        where.date = {
            ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
            ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
        };
    }
    return miscellaneousExpenseRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await miscellaneousExpenseRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: MiscellaneousExpenseInput, meta?: RequestMeta) {
    const taxTotals = calculateTaxTotals(input.price, input.gst, input.sgst);
    const created = await miscellaneousExpenseRepository.create({
        itemName: input.itemName,
        voucherId: input.voucherId,
        price: input.price,
        date: asDate(input.date),
        gst: input.gst,
        sgst: input.sgst,
        ...taxTotals,
        paymentMethod: input.paymentMethod,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "MISCELLANEOUS_EXPENSE_CREATED",
        resourceType: "MISCELLANEOUS_EXPENSE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: MiscellaneousExpensePatchInput,
    meta?: RequestMeta,
) {
    const found = await miscellaneousExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const price = input.price ?? Number(found.price);
    const gst = input.gst ?? Number(found.gst);
    const sgst = input.sgst ?? Number(found.sgst);
    const updated = await miscellaneousExpenseRepository.update(id, {
        ...(input.itemName !== undefined ? { itemName: input.itemName } : {}),
        ...(input.voucherId !== undefined ? { voucherId: input.voucherId } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.date ? { date: asDate(input.date) } : {}),
        ...(input.gst !== undefined ? { gst: input.gst } : {}),
        ...(input.sgst !== undefined ? { sgst: input.sgst } : {}),
        ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
        ...calculateTaxTotals(price, gst, sgst),
    });
    await writeAudit({
        userId: user.id,
        action: "MISCELLANEOUS_EXPENSE_UPDATED",
        resourceType: "MISCELLANEOUS_EXPENSE",
        resourceId: id,
        metadata: {
            itemName: found.itemName,
            voucherId: found.voucherId,
            date: found.date.toISOString().slice(0, 10),
            totalAmount: found.totalAmount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await miscellaneousExpenseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await miscellaneousExpenseRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "MISCELLANEOUS_EXPENSE_DELETED",
        resourceType: "MISCELLANEOUS_EXPENSE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
