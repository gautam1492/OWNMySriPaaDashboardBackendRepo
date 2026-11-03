import type { RequestHandler } from "express";
import type { RoleName } from "@prisma/client";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import type { PermissionKey } from "../constants/permissions.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Gate a route behind a set of allowed roles.
 * The user must be authenticated and their role must be in the list.
 */
export function requireRoles(...roles: RoleName[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user) return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH_REQUIRED));
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.INSUFFICIENT_PERMISSIONS));
        }
        next();
    };
}

/**
 * Gate a route behind one or more granular permissions.
 *
 * SUPER_ADMIN implicitly holds every permission.
 * Other roles must carry the permission key(s) in their effective
 * permission set (role defaults + extras granted by a manager).
 *
 * Use `requireAnyOf` when any single permission is sufficient.
 */
export function requirePermission(...keys: PermissionKey[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user) return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH_REQUIRED));
        if (req.user.role === ROLES.SUPER_ADMIN) return next();
        const hasAll = keys.every((k) => req.user!.permissions.includes(k));
        if (!hasAll) {
            return next(new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.INSUFFICIENT_PERMISSIONS));
        }
        next();
    };
}

/**
 * Allow the request when the user has at least one of the given permissions.
 */
export function requireAnyOf(...keys: PermissionKey[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user) return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH_REQUIRED));
        if (req.user.role === ROLES.SUPER_ADMIN) return next();
        const hasAny = keys.some((k) => req.user!.permissions.includes(k));
        if (!hasAny) {
            return next(new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.INSUFFICIENT_PERMISSIONS));
        }
        next();
    };
}
