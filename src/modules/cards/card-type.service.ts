import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as cardTypeRepository from "./card-type.repository.js";
import type {
    AuthUser,
    CardTypeInput,
    CardTypePatchInput,
    RequestMeta,
} from "./card-type.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.search) {
        where.name = { contains: query.search };
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }
    return cardTypeRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await cardTypeRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CardTypeInput, meta?: RequestMeta) {
    const created = await cardTypeRepository.create({
        name: input.name,
        defaultPrice: input.defaultPrice,
        isActive: input.isActive ?? true,
    });
    await writeAudit({
        userId: user.id,
        action: "CARD_TYPE_CREATED",
        resourceType: "CARD_TYPE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CardTypePatchInput,
    meta?: RequestMeta,
) {
    const found = await cardTypeRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const updated = await cardTypeRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.defaultPrice !== undefined ? { defaultPrice: input.defaultPrice } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "CARD_TYPE_UPDATED",
        resourceType: "CARD_TYPE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await cardTypeRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await cardTypeRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "CARD_TYPE_DELETED",
        resourceType: "CARD_TYPE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
