import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ACCESS_TOKEN_COOKIE } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";
import { getCurrentAuthUser, verifyAccessToken } from "../modules/auth/auth.service.js";
import { safeErrorMetadata } from "../utils/safeError.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
    // HttpOnly cookie is the only accepted access-token transport.
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!token) {
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH_REQUIRED));
    }
    let userId: string;
    try {
        userId = verifyAccessToken(token).sub;
    } catch (error) {
        if (env.NODE_ENV !== "production") {
            req.log?.debug(safeErrorMetadata(error), "Access token verification failed");
        }
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN));
    }
    try {
        const currentUser = await getCurrentAuthUser(userId);
        if (!currentUser) {
            return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN));
        }
        req.user = currentUser;
    } catch (error) {
        next(error);
    }
    if (req.user) next();
}
