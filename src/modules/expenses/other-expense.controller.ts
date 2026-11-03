import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as otherExpenseService from "./other-expense.service.js";
import type { OtherExpenseListQuery } from "./other-expense.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as unknown as OtherExpenseListQuery;
    const result = await otherExpenseService.list(req.user!, query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function getById(req: Request, res: Response) {
    return ApiResponse.success(res, await otherExpenseService.getById(String(req.params.id)));
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await otherExpenseService.create(req.user!, req.body, getRequestMeta(req)),
        MESSAGES.BRANCH_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await otherExpenseService.update(
            req.user!,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.BRANCH_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await otherExpenseService.remove(req.user!, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.BRANCH_DELETED);
}
