import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse, serialize } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as itemService from "./item.service.js";
import type { ItemListQuery } from "./item.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as ItemListQuery;
    const result = await itemService.list(query);
    return ApiResponse.paginated(
        res,
        serialize(result.items),
        query.page,
        query.limit,
        result.total,
    );
}

export async function getById(req: Request, res: Response) {
    return ApiResponse.success(res, serialize(await itemService.getById(String(req.params.id))));
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await itemService.create(req.user!.id, req.body, getRequestMeta(req)),
        MESSAGES.ITEM_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function importMany(req: Request, res: Response) {
    const result = await itemService.importMany(req.user!.id, req.body, getRequestMeta(req));
    const message = result.skippedCount
        ? `Imported ${result.importedCount} item(s); skipped ${result.skippedCount} duplicate(s).`
        : `Imported ${result.importedCount} item(s).`;
    return ApiResponse.success(res, result, message, HTTP_STATUS.CREATED);
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await itemService.update(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.ITEM_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await itemService.deleteItem(req.user!.id, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.ITEM_DELETED);
}
