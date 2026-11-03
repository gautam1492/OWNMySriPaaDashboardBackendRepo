import { prisma } from "../../config/database.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import { calculateTaxTotals } from "./tax-totals.js";
import type { AuthUser, RequestMeta } from "./branch-expense.types.js";
import type { BranchExpenseKind } from "./branch-expense.validator.js";

const delegates: Record<BranchExpenseKind, any> = {
    salary: prisma.branchSalary,
    rent: prisma.branchRent,
    waterBill: prisma.branchWaterBill,
    powerBill: prisma.branchPowerBill,
    foodGroceries: prisma.branchFoodGroceries,
    governmentFee: prisma.branchGovernmentFee,
    investmentPurchase: prisma.branchInvestmentPurchase,
    miscellaneous: prisma.branchMiscellaneousExpense,
};

function getDelegate(kind: BranchExpenseKind) {
    return delegates[kind];
}

function normalize(kind: BranchExpenseKind, input: Record<string, any>) {
    const data = { ...input };
    for (const field of ["date", "dateCredited", "paidDate", "assignedDate"]) {
        if (data[field]) data[field] = asDate(data[field]);
    }
    if (kind === "rent" && data.rentAmount !== undefined && data.tdsPercentage !== undefined) {
        const rent = Number(data.rentAmount);
        const tds = Number(data.tdsPercentage);
        data.tdsDeduction = Math.round(((rent * tds) / 100 + Number.EPSILON) * 100) / 100;
        data.netAmount = Math.round((rent - data.tdsDeduction + Number.EPSILON) * 100) / 100;
    }
    if (
        ["governmentFee", "investmentPurchase", "miscellaneous"].includes(kind) &&
        data.price !== undefined &&
        data.gst !== undefined &&
        data.sgst !== undefined
    ) {
        Object.assign(
            data,
            calculateTaxTotals(Number(data.price), Number(data.gst), Number(data.sgst)),
        );
    }
    if (kind === "foodGroceries" && data.amount !== undefined) data.totalAmount = data.amount;
    return data;
}

export async function list(user: AuthUser, kind: BranchExpenseKind, query: any) {
    const scope = branchFilter(user, query.branchId);
    const where: any = {};
    if (scope.branchId !== undefined) where.branchId = scope.branchId;
    if (query.year) where.year = query.year;
    if (query.month && kind === "governmentFee") {
        const monthIndex = [
            "JANUARY",
            "FEBRUARY",
            "MARCH",
            "APRIL",
            "MAY",
            "JUNE",
            "JULY",
            "AUGUST",
            "SEPTEMBER",
            "OCTOBER",
            "NOVEMBER",
            "DECEMBER",
        ].indexOf(query.month);
        const year = query.year ?? new Date().getFullYear();
        where.date = {
            gte: new Date(Date.UTC(year, monthIndex, 1)),
            lt: new Date(Date.UTC(year, monthIndex + 1, 1)),
        };
    } else if (query.month) {
        where.month = query.month;
    }
    if (query.startDate || query.endDate) {
        const dateField =
            kind === "salary"
                ? "dateCredited"
                : ["waterBill", "powerBill"].includes(kind)
                  ? "paidDate"
                  : kind === "rent"
                    ? undefined
                    : "date";
        if (dateField)
            where[dateField] = {
                ...(where[dateField] ?? {}),
                ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
                ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
            };
    }
    const delegate = getDelegate(kind);
    const [items, total] = await prisma.$transaction([
        delegate.findMany({
            where,
            include: { branch: true },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (query.page - 1) * query.limit,
            take: query.limit,
        }),
        delegate.count({ where }),
    ]);
    return { items, total };
}

export async function getById(kind: BranchExpenseKind, id: string, user: AuthUser) {
    const item = await getDelegate(kind).findUnique({ where: { id }, include: { branch: true } });
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureBranchAccess(user, item.branchId);
    return item;
}

export async function create(
    user: AuthUser,
    kind: BranchExpenseKind,
    input: Record<string, any>,
    meta?: RequestMeta,
) {
    await ensureBranchAccess(user, input.branchId);
    const data = normalize(kind, input);
    const created = await getDelegate(kind).create({
        data: { ...data, createdById: user.id, updatedById: user.id },
        include: { branch: true },
    });
    await writeAudit({
        userId: user.id,
        action: `BRANCH_${kind.toUpperCase()}_CREATED`,
        resourceType: `BRANCH_${kind.toUpperCase()}`,
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    kind: BranchExpenseKind,
    id: string,
    input: Record<string, any>,
    meta?: RequestMeta,
) {
    const found = await getDelegate(kind).findUnique({ where: { id } });
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    if (input.branchId) await ensureBranchAccess(user, input.branchId);
    const merged = { ...found, ...input };
    const data = normalize(kind, input);
    if (kind === "rent" && (input.rentAmount !== undefined || input.tdsPercentage !== undefined)) {
        Object.assign(
            data,
            normalize(kind, { rentAmount: merged.rentAmount, tdsPercentage: merged.tdsPercentage }),
        );
    }
    if (
        ["governmentFee", "investmentPurchase", "miscellaneous"].includes(kind) &&
        ["price", "gst", "sgst"].some((f) => input[f] !== undefined)
    ) {
        Object.assign(
            data,
            calculateTaxTotals(Number(merged.price), Number(merged.gst), Number(merged.sgst)),
        );
    }
    const updated = await getDelegate(kind).update({
        where: { id },
        data: { ...data, updatedById: user.id },
        include: { branch: true },
    });
    await writeAudit({
        userId: user.id,
        action: `BRANCH_${kind.toUpperCase()}_UPDATED`,
        resourceType: `BRANCH_${kind.toUpperCase()}`,
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(
    user: AuthUser,
    kind: BranchExpenseKind,
    id: string,
    meta?: RequestMeta,
) {
    const found = await getDelegate(kind).findUnique({ where: { id } });
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureBranchAccess(user, found.branchId);
    const branch = await prisma.branch.findUnique({
        where: { id: found.branchId },
        select: { name: true },
    });
    await getDelegate(kind).delete({ where: { id } });
    await writeAudit({
        userId: user.id,
        action: `BRANCH_${kind.toUpperCase()}_DELETED`,
        resourceType: `BRANCH_${kind.toUpperCase()}`,
        resourceId: id,
        metadata: {
            expenseKind: kind,
            branchName: branch?.name,
            branchId: found.branchId,
            ...Object.fromEntries(
                [
                    "personName",
                    "role",
                    "itemName",
                    "invoiceId",
                    "billId",
                    "voucherId",
                    "year",
                    "month",
                    "date",
                    "paidDate",
                    "assignedDate",
                    "totalAmount",
                    "amount",
                    "salary",
                    "rentAmount",
                    "netAmount",
                ].flatMap((key) => {
                    const value = found[key];
                    if (value === null || value === undefined) return [];
                    const safeValue =
                        value instanceof Date
                            ? value.toISOString().slice(0, 10)
                            : typeof value === "object" && "toString" in value
                              ? value.toString()
                              : value;
                    return [[key, safeValue]];
                }),
            ),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
