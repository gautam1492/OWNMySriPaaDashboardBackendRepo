import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as workspaceService from "./workspace.service.js";

export async function summary(req: Request, res: Response) {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    return ApiResponse.success(res, await workspaceService.summary(req.user!, branchId));
}
