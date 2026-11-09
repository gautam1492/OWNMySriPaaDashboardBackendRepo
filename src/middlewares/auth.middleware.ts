import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ACCESS_TOKEN_COOKIE } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";
import { getCurrentAuthUser, verifyAccessToken } from "../modules/auth/auth.service.js";
import * as authRepository from "../modules/auth/auth.repository.js";
import { safeErrorMetadata } from "../utils/safeError.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
    // HttpOnly cookie is the only accepted access-token transport.
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!token) {
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH_REQUIRED));
    }
    let userId: string;
    let sessionId: string;
    try {
        const payload = verifyAccessToken(token);
        userId = payload.sub;
        sessionId = payload.sid;
        if (!sessionId) throw new Error("Access token has no active session identifier");
    } catch (error) {
        if (env.NODE_ENV !== "production") {
            req.log?.debug(safeErrorMetadata(error), "Access token verification failed");
        }
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN));
    }
    try {
        const now = new Date();
        const session = await authRepository.findSessionForUser(sessionId, userId, now);
        if (!session) {
            return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN));
        }
        const currentUser = await getCurrentAuthUser(userId);
        if (!currentUser) {
            return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN));
        }
        req.user = currentUser;
        req.authSessionId = sessionId;
        if (session.lastActiveAt.getTime() < now.getTime() - 5 * 60 * 1000) {
            await authRepository.touchSession(
                sessionId,
                new Date(now.getTime() - 5 * 60 * 1000),
                now,
            );
        }
    } catch (error) {
        return next(error);
    }
    return next();
}
