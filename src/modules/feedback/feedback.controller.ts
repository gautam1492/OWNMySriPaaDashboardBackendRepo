import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as feedbackService from "./feedback.service.js";
import type { FeedbackListQuery } from "./feedback.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as FeedbackListQuery;
    const result = await feedbackService.list(req.user!, query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await feedbackService.create(req.user!, req.body, getRequestMeta(req)),
        MESSAGES.FEEDBACK_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await feedbackService.update(req.user!, String(req.params.id), req.body),
        MESSAGES.FEEDBACK_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await feedbackService.deleteFeedback(req.user!, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.FEEDBACK_DELETED);
}
