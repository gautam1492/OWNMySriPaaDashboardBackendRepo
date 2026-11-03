import type { EntryType } from "@prisma/client";
import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse, serialize } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as saleService from "./sale.service.js";
import type { SaleListQuery } from "./sale.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as SaleListQuery;
    const result = await saleService.listSales(req.user!, {
        ...query,
        entryType: query.entryType as EntryType,
    });
    return ApiResponse.paginated(
        res,
        serialize(result.items),
        query.page,
        query.limit,
        result.total,
    );
}

export async function getById(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        serialize(await saleService.getSale(req.user!, String(req.params.id))),
    );
}

export async function create(req: Request, res: Response) {
    const created = await saleService.createSale(req.user!, req.body, getRequestMeta(req));
    return ApiResponse.success(res, serialize(created), MESSAGES.SALE_CREATED, HTTP_STATUS.CREATED);
}

export async function update(req: Request, res: Response) {
    const updated = await saleService.updateSale(
        req.user!,
        String(req.params.id),
        req.body,
        getRequestMeta(req),
    );
    return ApiResponse.success(res, serialize(updated), MESSAGES.SALE_UPDATED);
}

export async function remove(req: Request, res: Response) {
    await saleService.deleteSale(req.user!, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.SALE_DELETED);
}
