import type { Response } from "express";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { paginationMeta } from "./pagination.js";

export function serialize<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_key, nestedValue) =>
            typeof nestedValue === "object" && nestedValue !== null && "toNumber" in nestedValue
                ? nestedValue.toNumber()
                : nestedValue,
        ),
    ) as T;
}

export class ApiResponse {
    static success<T>(
        res: Response,
        data: T,
        message: string = MESSAGES.SUCCESS,
        status: number = HTTP_STATUS.OK,
    ) {
        return res.status(status).json({ success: true, message, data });
    }

    static paginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message: string = MESSAGES.SUCCESS,
    ) {
        return ApiResponse.success(
            res,
            { items: data, pagination: paginationMeta(page, limit, total) },
            message,
        );
    }
}
