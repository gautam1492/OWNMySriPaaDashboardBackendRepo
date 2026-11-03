import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { isCrossBranchRole, ROLES } from "../../constants/roles.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import { calculateTaxTotals } from "./tax-totals.js";
import * as coreInvestmentRepository from "./core-investment.repository.js";
import type {
    AuthUser,
    CoreInvestmentInput,
    CoreInvestmentPatchInput,
    RequestMeta,
} from "./core-investment.types.js";

async function ensureCoreInvestmentAccess(
    user: AuthUser,
    record: { belongsTo: "COMPANY" | "BRANCH"; branchId: string | null },
) {
    if (record.belongsTo === "COMPANY") {
        if (isCrossBranchRole(user.role) || user.role === ROLES.DIRECTOR) return;
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.INSUFFICIENT_PERMISSIONS);
    }
    if (!record.branchId) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    }
    await ensureBranchAccess(user, record.branchId);
}

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    const isDirectorCompanyView = user.role === ROLES.DIRECTOR && query.belongsTo === "COMPANY";
    if (!isDirectorCompanyView) {
        const branch = branchFilter(user, query.branchId);
        if ("branchId" in branch && branch.branchId !== undefined) {
            where.branchId = branch.branchId;
        }
    }
    if (query.belongsTo) {
        where.belongsTo = query.belongsTo;
    }
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
    return coreInvestmentRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(user: AuthUser, id: string) {
    const item = await coreInvestmentRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureCoreInvestmentAccess(user, item);
    return item;
}

export async function create(user: AuthUser, input: CoreInvestmentInput, meta?: RequestMeta) {
    if (input.branchId) {
        await ensureBranchAccess(user, input.branchId);
    }
    const taxTotals = calculateTaxTotals(input.price, input.gst, input.sgst);
    const created = await coreInvestmentRepository.create({
        itemName: input.itemName,
        invoiceId: input.invoiceId,
        price: input.price,
        billingDate: asDate(input.billingDate),
        paymentDate: asDate(input.paymentDate),
        gst: input.gst,
        sgst: input.sgst,
        ...taxTotals,
        belongsTo: input.belongsTo,
        branchId: input.branchId,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "CORE_INVESTMENT_CREATED",
        resourceType: "CORE_INVESTMENT",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CoreInvestmentPatchInput,
    meta?: RequestMeta,
) {
    const found = await coreInvestmentRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureCoreInvestmentAccess(user, found);
    const nextBelongsTo = input.belongsTo ?? found.belongsTo;
    const nextBranchId = input.branchId !== undefined ? input.branchId : found.branchId;
    if (nextBelongsTo === "COMPANY") {
        await ensureCoreInvestmentAccess(user, { belongsTo: "COMPANY", branchId: nextBranchId });
    } else if (nextBranchId) {
        await ensureBranchAccess(user, nextBranchId);
    } else {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "A branch is required for branch investments.");
    }
    const price = input.price ?? Number(found.price);
    const gst = input.gst ?? Number(found.gst);
    const sgst = input.sgst ?? Number(found.sgst);
    const updated = await coreInvestmentRepository.update(id, {
        ...(input.itemName !== undefined ? { itemName: input.itemName } : {}),
        ...(input.invoiceId !== undefined ? { invoiceId: input.invoiceId } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.billingDate ? { billingDate: asDate(input.billingDate) } : {}),
        ...(input.paymentDate ? { paymentDate: asDate(input.paymentDate) } : {}),
        ...(input.gst !== undefined ? { gst: input.gst } : {}),
        ...(input.sgst !== undefined ? { sgst: input.sgst } : {}),
        ...(input.belongsTo !== undefined ? { belongsTo: input.belongsTo } : {}),
        ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
        ...calculateTaxTotals(price, gst, sgst),
    });
    await writeAudit({
        userId: user.id,
        action: "CORE_INVESTMENT_UPDATED",
        resourceType: "CORE_INVESTMENT",
        resourceId: id,
        metadata: {
            itemName: found.itemName,
            invoiceId: found.invoiceId,
            totalAmount: found.totalAmount.toString(),
            belongsTo: found.belongsTo,
            ...(found.branch ? { branchName: found.branch.name } : {}),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await coreInvestmentRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await ensureCoreInvestmentAccess(user, found);
    await coreInvestmentRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "CORE_INVESTMENT_DELETED",
        resourceType: "CORE_INVESTMENT",
        resourceId: id,
        metadata: found.branchId ? { branchId: found.branchId } : undefined,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
