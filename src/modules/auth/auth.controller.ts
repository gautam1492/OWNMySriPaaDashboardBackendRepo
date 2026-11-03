import type { Request, Response } from "express";
import {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    accessCookieOptions,
    clearAccessCookieOptions,
    clearRefreshCookieOptions,
    refreshCookieOptions,
} from "./auth.cookies.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as authService from "./auth.service.js";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(
        ACCESS_TOKEN_COOKIE,
        accessToken,
        accessCookieOptions(authService.accessTokenMaxAgeMs()),
    );
    res.cookie(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        refreshCookieOptions(authService.refreshTokenMaxAgeMs()),
    );
}

function clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, clearAccessCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshCookieOptions());
}

export async function login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password, getRequestMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return ApiResponse.success(
        res,
        { user: result.user, accessTokenExpiresAt: result.accessTokenExpiresAt },
        MESSAGES.LOGIN_SUCCESS,
    );
}

export async function refresh(req: Request, res: Response) {
    // Refresh cookie is scoped to /api/v1/auth, so only refresh/logout receive it.
    // HttpOnly cookies only: no token is accepted from the request body.
    const result = await authService.refresh(
        req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined,
        getRequestMeta(req),
    );
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return ApiResponse.success(
        res,
        { user: result.user, accessTokenExpiresAt: result.accessTokenExpiresAt },
        MESSAGES.TOKEN_REFRESHED,
    );
}

export async function logout(req: Request, res: Response) {
    // Logout works with an expired access token (or none): identity comes from the refresh cookie.
    await authService.logout(
        req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined,
        getRequestMeta(req),
        authService.decodeUserIdAllowingExpiry(
            req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined,
        ) ?? req.user?.id,
    );
    clearAuthCookies(res);
    return ApiResponse.success(res, null, MESSAGES.LOGGED_OUT);
}

export async function me(req: Request, res: Response) {
    return ApiResponse.success(res, req.user);
}

export async function profile(req: Request, res: Response) {
    return ApiResponse.success(res, await authService.getProfile(req.user!.id));
}

export async function updateProfile(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await authService.updateProfile(req.user!.id, req.body, getRequestMeta(req)),
        "Profile updated",
    );
}

export async function changePassword(req: Request, res: Response) {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    clearAuthCookies(res);
    return ApiResponse.success(res, null, MESSAGES.PASSWORD_CHANGED);
}

export async function forgotPassword(req: Request, res: Response) {
    const status = await authService.requestPasswordReset(req.body.email);
    const messages: Record<typeof status, string> = {
        "not-found": "No account is registered with that email address. No email was sent.",
        "not-eligible":
            "No active, verified account is available for that email address. No email was sent.",
        cooldown:
            "A reset email was requested recently. Please check your inbox or try again in one minute.",
        sent: "Password reset email sent. Check your inbox.",
        "delivery-failed":
            "The account was found, but the reset email could not be delivered. Please try again later or contact an administrator.",
    };
    return ApiResponse.success(res, { status }, messages[status]);
}

export async function resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    return ApiResponse.success(res, null, "Password updated. You can now sign in.");
}
