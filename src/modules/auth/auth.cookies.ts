import type { CookieOptions } from "express";

import { env } from "../../config/env.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../../constants/index.js";

function baseCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        path: "/",
    };
}

export function accessCookieOptions(maxAge: number): CookieOptions {
    return { ...baseCookieOptions(), maxAge };
}

export function refreshCookieOptions(maxAge: number): CookieOptions {
    return { ...baseCookieOptions(), path: "/api/v1/auth", maxAge };
}

export function clearAccessCookieOptions(): CookieOptions {
    return { ...baseCookieOptions() };
}

export function clearRefreshCookieOptions(): CookieOptions {
    return { ...baseCookieOptions(), path: "/api/v1/auth" };
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
