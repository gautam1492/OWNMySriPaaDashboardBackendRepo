import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as visitService from "./patient-visit.service.js";
import type { VisitListQuery } from "./patient-visit.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as VisitListQuery;
    const result = await visitService.list(req.user!, query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await visitService.create(req.user!, req.body, getRequestMeta(req)),
        MESSAGES.PATIENT_VISIT_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await visitService.update(req.user!, String(req.params.id), req.body),
        MESSAGES.PATIENT_VISIT_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await visitService.deleteVisit(req.user!, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.PATIENT_VISIT_DELETED);
}
