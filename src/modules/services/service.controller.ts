import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as serviceService from "./service.service.js";

export async function list(_req: Request, res: Response) {
    return ApiResponse.success(res, await serviceService.listActive());
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await serviceService.create(req.user!.id, req.body, getRequestMeta(req)),
        MESSAGES.SERVICE_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await serviceService.update(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.SERVICE_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await serviceService.deleteService(req.user!.id, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.SERVICE_DELETED);
}
