import { describe, expect, it } from "vitest";
import {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    accessCookieOptions,
    clearAccessCookieOptions,
    clearRefreshCookieOptions,
    refreshCookieOptions,
} from "../../src/modules/auth/auth.cookies.js";

describe("auth cookies", () => {
    it("uses distinct cookie names for access and refresh tokens", () => {
        expect(ACCESS_TOKEN_COOKIE).toBe("sripaa_access_token");
        expect(REFRESH_TOKEN_COOKIE).toBe("sripaa_refresh_token");
        expect(ACCESS_TOKEN_COOKIE).not.toBe(REFRESH_TOKEN_COOKIE);
    });

    it("keeps all auth cookies HttpOnly and builds matching clear options", () => {
        const access = accessCookieOptions(900_000);
        const refresh = refreshCookieOptions(604_800_000);
        expect(access.httpOnly).toBe(true);
        expect(refresh.httpOnly).toBe(true);
        expect(access.path).toBe("/");
        expect(refresh.path).toBe("/api/v1/auth");
        expect(clearAccessCookieOptions().path).toBe(access.path);
        expect(clearRefreshCookieOptions().path).toBe(refresh.path);
        expect(clearAccessCookieOptions().secure).toBe(access.secure);
        expect(clearRefreshCookieOptions().secure).toBe(refresh.secure);
        expect(clearAccessCookieOptions().sameSite).toBe(access.sameSite);
        expect(clearRefreshCookieOptions().sameSite).toBe(refresh.sameSite);
    });
});
