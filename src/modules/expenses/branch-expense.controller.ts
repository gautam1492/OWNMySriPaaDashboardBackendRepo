import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as branchExpenseService from "./branch-expense.service.js";
import type { BranchExpenseListQuery } from "./branch-expense.types.js";
import type { BranchExpenseKind } from "./branch-expense.validator.js";

function getKind(res: Response): BranchExpenseKind {
    const kind = res.locals.expenseKind as BranchExpenseKind | undefined;
    if (!kind) throw new Error("Branch expense kind was not provided by its route.");
    return kind;
}

export async function list(req: Request, res: Response) {
    const query = req.query as unknown as BranchExpenseListQuery;
    const result = await branchExpenseService.list(req.user!, getKind(res), query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function getById(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await branchExpenseService.getById(getKind(res), String(req.params.id), req.user!),
    );
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await branchExpenseService.create(req.user!, getKind(res), req.body, getRequestMeta(req)),
        MESSAGES.BRANCH_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await branchExpenseService.update(
            req.user!,
            getKind(res),
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.BRANCH_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await branchExpenseService.remove(
        req.user!,
        getKind(res),
        String(req.params.id),
        getRequestMeta(req),
    );
    return ApiResponse.success(res, null, MESSAGES.BRANCH_DELETED);
}
