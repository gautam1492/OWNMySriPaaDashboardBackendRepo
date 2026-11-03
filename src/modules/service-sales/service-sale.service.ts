import { Prisma } from "@prisma/client";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { branchFilter } from "../../utils/branchScope.js";
import { ensureBranchAccess } from "../branches/branch-access.js";
import { writeAudit } from "../audit/audit.service.js";
import * as serviceRepository from "../services/service.repository.js";
import * as serviceSaleRepository from "./service-sale.repository.js";
import type {
    AuthUser,
    RequestMeta,
    ServiceSaleInput,
    ServiceSaleListQuery,
} from "./service-sale.types.js";

async function resolveService(serviceId: string, serviceType: ServiceSaleInput["serviceType"]) {
    const service = await serviceRepository.findById(serviceId);
    if (!service || !service.isActive) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.SERVICE_INACTIVE);
    }
    if (service.type !== serviceType) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.SERVICE_SALE_INVALID);
    }
    return service;
}

export async function list(user: AuthUser, query: ServiceSaleListQuery) {
    const branch = branchFilter(user, query.branchId);
    const where: Prisma.ServiceSaleWhereInput = {
        ...branch,
        ...(query.serviceType ? { serviceType: query.serviceType } : {}),
        ...(query.startDate || query.endDate
            ? {
                  date: {
                      ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
                      ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
                  },
              }
            : {}),
    };
    return serviceSaleRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(user: AuthUser, id: string) {
    const sale = await serviceSaleRepository.findById(id);
    if (!sale) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.SERVICE_SALE_NOT_FOUND);
    await ensureBranchAccess(user, sale.branchId);
    return sale;
}

export async function create(user: AuthUser, input: ServiceSaleInput, meta?: RequestMeta) {
    await ensureBranchAccess(user, input.branchId);
    const service = await resolveService(input.serviceId, input.serviceType);
    const created = await serviceSaleRepository.create({
        date: asDate(input.date),
        branch: { connect: { id: input.branchId } },
        service: { connect: { id: service.id } },
        serviceType: service.type,
        serviceNameSnapshot: service.name,
        amount: input.amount,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "SERVICE_SALE_CREATED",
        resourceType: "SERVICE_SALE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: ServiceSaleInput,
    meta?: RequestMeta,
) {
    const existing = await serviceSaleRepository.findById(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.SERVICE_SALE_NOT_FOUND);
    await ensureBranchAccess(user, existing.branchId);
    await ensureBranchAccess(user, input.branchId);
    const service = await resolveService(input.serviceId, input.serviceType);
    const updated = await serviceSaleRepository.update(id, {
        date: asDate(input.date),
        branch: { connect: { id: input.branchId } },
        service: { connect: { id: service.id } },
        serviceType: service.type,
        serviceNameSnapshot: service.name,
        amount: input.amount,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "SERVICE_SALE_UPDATED",
        resourceType: "SERVICE_SALE",
        resourceId: updated.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const sale = await getById(user, id);
    await serviceSaleRepository.remove(sale.id);
    await writeAudit({
        userId: user.id,
        action: "SERVICE_SALE_DELETED",
        resourceType: "SERVICE_SALE",
        resourceId: sale.id,
        metadata: { branchId: sale.branchId },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
