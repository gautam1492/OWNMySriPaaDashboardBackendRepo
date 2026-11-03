import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as directorService from "./director.service.js";
import type { DirectorListQuery } from "./director.types.js";

export async function list(req: Request, res: Response) {
    const query = req.query as unknown as DirectorListQuery;
    const result = await directorService.list(query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function getById(req: Request, res: Response) {
    return ApiResponse.success(res, await directorService.getById(String(req.params.id)));
}
