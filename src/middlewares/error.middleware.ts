import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { safeErrorMetadata } from "../utils/safeError.js";

/**
 * Prisma error codes that mean "the database cannot be reached / is not ready"
 * rather than "your query was wrong".
 */
const DATABASE_DOWN_CODES = new Set([
    "P1000", // authentication failed
    "P1001", // can't reach database server
    "P1002", // database server timed out
    "P1003", // database does not exist
    "P1008", // operations timed out
    "P1017", // server closed the connection
]);

function isDatabaseDown(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    return error instanceof Prisma.PrismaClientKnownRequestError
        ? DATABASE_DOWN_CODES.has(error.code)
        : false;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    const requestLogger = req.log ?? logger;
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(error.errors ? { errors: error.errors } : {}),
        });
    }
    if (error instanceof ZodError) {
        return res.status(HTTP_STATUS.UNPROCESSABLE).json({
            success: false,
            message: MESSAGES.VALIDATION_FAILED,
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: MESSAGES.DUPLICATE_RECORD,
        });
    }
    if (isDatabaseDown(error)) {
        requestLogger.error(
            { requestId: req.id, ...safeErrorMetadata(error) },
            "Database unavailable",
        );
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
            success: false,
            message: MESSAGES.DATABASE_UNAVAILABLE,
        });
    }
    requestLogger.error(
        { requestId: req.id, ...safeErrorMetadata(error) },
        "Unhandled request error",
    );
    return res.status(HTTP_STATUS.INTERNAL).json({
        success: false,
        message:
            env.NODE_ENV === "production"
                ? MESSAGES.INTERNAL_ERROR
                : error instanceof Error
                  ? error.message
                  : MESSAGES.INTERNAL_ERROR,
    });
};
