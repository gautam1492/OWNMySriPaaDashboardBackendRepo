import { EntryType, ItemType, Prisma } from "@prisma/client";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { calculateMedicineTotals, roundMoney } from "../../utils/financial.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import * as itemRepository from "../items/item.repository.js";
import * as saleRepository from "./sale.repository.js";
import type { AuthUser, RequestMeta, SaleInput, SaleListQuery } from "./sale.types.js";

const MAX_STORED_SALE_AMOUNT = 9_999_999_999.99;

function ensureSaleAmountFits(value: number, field: string) {
    if (!Number.isFinite(value) || value > MAX_STORED_SALE_AMOUNT) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.SALE_AMOUNT_OUT_OF_RANGE, [
            { field, message: MESSAGES.SALE_AMOUNT_OUT_OF_RANGE },
        ]);
    }
}

function expectedItemType(entryType: EntryType): ItemType {
    return entryType === EntryType.OTC ? ItemType.OTC : ItemType.MEDICINE;
}

async function buildSaleItems(input: SaleInput) {
    if (!input.items?.length) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.SALE_ENTRY_INVALID);
    }
    // Repeated catalog items are valid on separate receipt lines. Compare the
    // fetched active items with unique IDs so duplicates do not look missing.
    const itemIds = [...new Set(input.items.map((item) => item.itemId))];
    const items = await itemRepository.findActiveByIds(itemIds);
    if (items.length !== itemIds.length) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.ITEMS_INACTIVE);
    }
    const expected = expectedItemType(input.entryType);
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const lineItems = input.items.map((item, index) => {
        const catalogue = itemMap.get(item.itemId);
        if (!catalogue || catalogue.type !== expected) {
            throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.ITEM_TYPE_MISMATCH);
        }
        const unitPrice = roundMoney(Number(item.unitPrice));
        const totalPrice = roundMoney(unitPrice * item.unitSold);
        ensureSaleAmountFits(totalPrice, `items.${index}.unitPrice`);
        return {
            item: { connect: { id: catalogue.id } },
            itemNameSnapshot: catalogue.name,
            unitSold: item.unitSold,
            unitPrice,
            totalPrice,
        };
    });
    const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.totalPrice, 0));
    ensureSaleAmountFits(subtotal, "items");
    const totals = calculateMedicineTotals(subtotal, input.gstPercentage, input.sgstPercentage);
    for (const field of ["gstAmount", "sgstAmount", "cgstAmount", "totalAmount"] as const) {
        ensureSaleAmountFits(totals[field], field);
    }
    return { totals, items: lineItems };
}

export async function createSale(user: AuthUser, input: SaleInput, meta?: RequestMeta) {
    await ensureBranchAccess(user, input.branchId);
    const payload = await buildSaleItems(input);
    const created = await saleRepository.create({
        date: asDate(input.date),
        entryType: input.entryType,
        ...payload.totals,
        branch: { connect: { id: input.branchId } },
        createdById: user.id,
        updatedById: user.id,
        items: { create: payload.items },
    });
    await writeAudit({
        userId: user.id,
        action: "SALE_CREATED",
        resourceType: "SALE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function updateSale(user: AuthUser, id: string, input: SaleInput, meta?: RequestMeta) {
    const existing = await saleRepository.findById(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.SALE_NOT_FOUND);
    await ensureBranchAccess(user, existing.branchId);
    await ensureBranchAccess(user, input.branchId);
    const payload = await buildSaleItems(input);
    const updated = await saleRepository.replaceItemsAndUpdate(
        id,
        {
            date: asDate(input.date),
            entryType: input.entryType,
            ...payload.totals,
            branch: { connect: { id: input.branchId } },
            updatedById: user.id,
        },
        payload.items,
    );
    await writeAudit({
        userId: user.id,
        action: "SALE_UPDATED",
        resourceType: "SALE",
        resourceId: updated.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function listSales(user: AuthUser, query: SaleListQuery) {
    const branch = branchFilter(user, query.branchId);
    const filter: Prisma.SaleWhereInput = {
        ...("branchId" in branch ? branch : {}),
        ...(query.entryType ? { entryType: query.entryType } : {}),
        ...(query.startDate || query.endDate
            ? {
                  date: {
                      ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
                      ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
                  },
              }
            : {}),
        ...(query.search
            ? { items: { some: { itemNameSnapshot: { contains: query.search } } } }
            : {}),
    };
    return saleRepository.list({
        where: filter,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getSale(user: AuthUser, id: string) {
    const item = await saleRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.SALE_NOT_FOUND);
    await ensureBranchAccess(user, item.branchId);
    return item;
}

export async function deleteSale(user: AuthUser, id: string, meta?: RequestMeta) {
    const item = await getSale(user, id);
    await saleRepository.remove(item.id);
    await writeAudit({
        userId: user.id,
        action: "SALE_DELETED",
        resourceType: "SALE",
        resourceId: item.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: {
            entryType: item.entryType,
            date: item.date.toISOString().slice(0, 10),
            totalAmount: item.totalAmount.toString(),
            branchName: item.branch.name,
            branchId: item.branchId,
        },
    });
}
