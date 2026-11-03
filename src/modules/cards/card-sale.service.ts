import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as cardSaleRepository from "./card-sale.repository.js";
import type {
    AuthUser,
    CardSaleInput,
    CardSalePatchInput,
    RequestMeta,
} from "./card-sale.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.cardTypeId) where.cardTypeId = query.cardTypeId;
    if (query.startDate || query.endDate) {
        where.date = {
            ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
            ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
        };
    }
    return cardSaleRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await cardSaleRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CardSaleInput, meta?: RequestMeta) {
    const numberOfCards = input.numberOfCards ?? 1;
    const cardPrice = Number(input.cardPrice);
    const totalAmount = numberOfCards * cardPrice;

    const created = await cardSaleRepository.create({
        cardTypeId: input.cardTypeId,
        date: asDate(input.date),
        cardPrice,
        numberOfCards,
        totalAmount,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "CARD_SALE_CREATED",
        resourceType: "CARD_SALE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CardSalePatchInput,
    meta?: RequestMeta,
) {
    const found = await cardSaleRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);

    const numberOfCards = input.numberOfCards ?? found.numberOfCards;
    const cardPrice =
        input.cardPrice !== undefined ? Number(input.cardPrice) : Number(found.cardPrice);
    const totalAmount = numberOfCards * cardPrice;

    const updated = await cardSaleRepository.update(id, {
        ...(input.cardTypeId !== undefined ? { cardTypeId: input.cardTypeId } : {}),
        ...(input.date ? { date: asDate(input.date) } : {}),
        ...(input.cardPrice !== undefined ? { cardPrice } : {}),
        ...(input.numberOfCards !== undefined ? { numberOfCards } : {}),
        ...(input.cardPrice !== undefined || input.numberOfCards !== undefined
            ? { totalAmount }
            : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "CARD_SALE_UPDATED",
        resourceType: "CARD_SALE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await cardSaleRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await cardSaleRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "CARD_SALE_DELETED",
        resourceType: "CARD_SALE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
