import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as auditService from "./audit.service.js";
import type { AuditListQuery } from "./audit.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as AuditListQuery;
    const result = await auditService.listAudits(query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function filters(_req: Request, res: Response) {
    return ApiResponse.success(res, await auditService.auditFilterOptions());
}
