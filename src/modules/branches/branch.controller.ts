import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as branchService from "./branch.service.js";

export async function list(req: Request, res: Response) {
    return ApiResponse.success(res, await branchService.listActive(req.user!));
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await branchService.create(req.body),
        MESSAGES.BRANCH_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function remove(req: Request, res: Response) {
    await branchService.deleteBranch(req.user!.id, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.BRANCH_DELETED);
}
