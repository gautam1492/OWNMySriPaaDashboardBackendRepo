import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse, serialize } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as serviceSaleService from "./service-sale.service.js";
import type { ServiceSaleListQuery } from "./service-sale.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as unknown as ServiceSaleListQuery;
    const result = await serviceSaleService.list(req.user!, query);
    return ApiResponse.paginated(
        res,
        serialize(result.items),
        query.page,
        query.limit,
        result.total,
    );
}

export async function getById(req: Request, res: Response) {
    const sale = await serviceSaleService.getById(req.user!, String(req.params.id));
    return ApiResponse.success(res, serialize(sale));
}

export async function create(req: Request, res: Response) {
    const sale = await serviceSaleService.create(req.user!, req.body, getRequestMeta(req));
    return ApiResponse.success(
        res,
        serialize(sale),
        MESSAGES.SERVICE_SALE_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    const sale = await serviceSaleService.update(
        req.user!,
        String(req.params.id),
        req.body,
        getRequestMeta(req),
    );
    return ApiResponse.success(res, serialize(sale), MESSAGES.SERVICE_SALE_UPDATED);
}

export async function remove(req: Request, res: Response) {
    await serviceSaleService.remove(req.user!, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.SERVICE_SALE_DELETED);
}
