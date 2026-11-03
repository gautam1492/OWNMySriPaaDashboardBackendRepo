import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as dashboardService from "./dashboard.service.js";
import type { PeriodQuery } from "./dashboard.types.js";

export async function summary(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await dashboardService.summary(req.user!, req.query as PeriodQuery),
    );
}

export async function trends(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await dashboardService.trends(req.user!, req.query as PeriodQuery),
    );
}

export async function branchVisitTrends(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await dashboardService.branchVisitTrends(req.user!, req.query as PeriodQuery),
    );
}
