import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as itemRepository from "./item.repository.js";
import type {
    ItemImportInput,
    ItemInput,
    ItemListQuery,
    ItemPatchInput,
    RequestMeta,
} from "./item.types.js";

export async function list(query: ItemListQuery) {
    const where = {
        ...(query.search ? { name: { contains: query.search } } : {}),
        ...(query.type ? { type: query.type } : {}),
    };
    return itemRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await itemRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.ITEM_NOT_FOUND);
    return item;
}

export async function create(actorId: string, input: ItemInput, meta?: RequestMeta) {
    const created = await itemRepository.create(input);
    await writeAudit({
        userId: actorId,
        action: "ITEM_CREATED",
        resourceType: "ITEM",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function importMany(actorId: string, input: ItemImportInput, meta?: RequestMeta) {
    const uniqueItems = new Map<string, { name: string; type: ItemInput["type"] }>();
    for (const item of input.items) {
        const name = item.name.trim();
        const key = `${name.toLocaleLowerCase()}\u0000${item.type}`;
        if (!uniqueItems.has(key)) uniqueItems.set(key, { name, type: item.type });
    }
    const itemsToCreate = [...uniqueItems.values()].map((item) => ({
        ...item,
        isActive: input.isActive,
    }));
    const result = await itemRepository.createMany(itemsToCreate);
    const skippedCount = input.items.length - result.count;
    await writeAudit({
        userId: actorId,
        action: "ITEMS_IMPORTED",
        resourceType: "ITEM",
        metadata: {
            importedCount: result.count,
            skippedCount,
            selectedStatus: input.isActive ? "ACTIVE" : "INACTIVE",
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return { importedCount: result.count, skippedCount };
}

export async function update(
    actorId: string,
    id: string,
    input: ItemPatchInput,
    meta?: RequestMeta,
) {
    const updated = await itemRepository.update(id, input);
    await writeAudit({
        userId: actorId,
        action: "ITEM_UPDATED",
        resourceType: "ITEM",
        resourceId: updated.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function deleteItem(actorId: string, id: string, meta?: RequestMeta) {
    const existing = await itemRepository.findById(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.ITEM_NOT_FOUND);
    await itemRepository.remove(id);
    await writeAudit({
        userId: actorId,
        action: "ITEM_DELETED",
        resourceType: "ITEM",
        resourceId: id,
        metadata: { name: existing.name, itemType: existing.type },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
