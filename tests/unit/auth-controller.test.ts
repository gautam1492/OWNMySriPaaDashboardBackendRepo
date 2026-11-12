import { describe, expect, it, vi, beforeEach } from "vitest";
import { env } from "../../src/config/env.js";

const { cookies, authService } = vi.hoisted(() => ({
    cookies: {
        set: new Map<string, { value: string; options: Record<string, unknown> }>(),
        cleared: [] as Array<{ name: string; options: Record<string, unknown> }>,
    },
    authService: {
        login: vi.fn(),
        refresh: vi.fn(),
        logout: vi.fn(),
        changePassword: vi.fn(),
        accessTokenMaxAgeMs: vi.fn(() => 900_000),
        refreshTokenMaxAgeMs: vi.fn(() => 604_800_000),
        decodeSessionIdentityAllowingExpiry: vi.fn(() => ({
            userId: "user-1",
            sessionId: "session-1",
        })),
    },
}));

vi.mock("../../src/modules/auth/auth.service.js", () => authService);
vi.mock("../../src/utils/requestMeta.js", () => ({ getRequestMeta: () => ({}) }));

type MockRes = {
    cookie: (...args: [string, string, Record<string, unknown>]) => void;
    clearCookie: (...args: [string, Record<string, unknown>]) => void;
    status: (...args: never[]) => unknown;
    json: { mock: { calls: Array<[unknown]> } } & ((body: unknown) => unknown);
} & Record<string, never>;

function makeRes(): MockRes {
    const res = {
        cookie: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
            cookies.set.set(name, { value, options });
        }),
        clearCookie: vi.fn((name: string, options: Record<string, unknown>) => {
            cookies.cleared.push({ name, options });
        }),
        status: vi.fn().mockReturnThis(),
        json: vi.fn((body: unknown) => body),
    };
    return res as unknown as MockRes;
}

function asRes(res: ReturnType<typeof makeRes>) {
    return res as never;
}

function resJson(res: ReturnType<typeof makeRes>) {
    const json = (res as unknown as { json: { mock: { calls: Array<[unknown]> } } }).json;
    return json.mock.calls[0][0] as { data: Record<string, unknown> };
}

describe("auth controller cookies", () => {
    beforeEach(() => {
        cookies.set.clear();
        cookies.cleared.length = 0;
        vi.clearAllMocks();
        authService.accessTokenMaxAgeMs.mockReturnValue(900_000);
        authService.refreshTokenMaxAgeMs.mockReturnValue(604_800_000);
        authService.decodeSessionIdentityAllowingExpiry.mockReturnValue({
            userId: "user-1",
            sessionId: "session-1",
        });
    });

    it("login sets both auth cookies and never returns tokens in the body", async () => {
        const { login } = await import("../../src/modules/auth/auth.controller.js");
        authService.login.mockResolvedValue({
            accessToken: "access",
            accessTokenExpiresAt: "2026-09-24T12:00:00.000Z",
            refreshToken: "refresh",
            refreshTokenExpiresAt: "2099-01-01T00:00:00.000Z",
            user: { id: "user-1" },
        });
        const res = makeRes();
        await login({ body: { email: "a@x.local", password: "password12" } } as never, asRes(res));

        expect(authService.login).toHaveBeenCalledOnce();
        expect(cookies.set.get("sripaa_access_token")?.value).toBe("access");
        expect(cookies.set.get("sripaa_refresh_token")?.value).toBe("refresh");
        expect(cookies.set.get("sripaa_access_token")?.options).toMatchObject({
            httpOnly: true,
            secure: env.NODE_ENV === "production" ? true : env.COOKIE_SECURE,
            sameSite: "lax",
            path: "/",
            maxAge: 900_000,
        });
        expect(cookies.set.get("sripaa_refresh_token")?.options).toMatchObject({
            httpOnly: true,
            secure: env.NODE_ENV === "production" ? true : env.COOKIE_SECURE,
            sameSite: "lax",
            path: "/api/v1/auth",
            maxAge: 604_800_000,
        });
        const body = resJson(res);
        expect(body.data).toEqual({
            user: { id: "user-1" },
            accessTokenExpiresAt: "2026-09-24T12:00:00.000Z",
        });
        expect(body.data).not.toHaveProperty("accessToken");
        expect(body.data).not.toHaveProperty("refreshToken");
    });

    it("refresh reads the cookie (not the body) and rotates both cookies", async () => {
        const { refresh } = await import("../../src/modules/auth/auth.controller.js");
        authService.refresh.mockResolvedValue({
            accessToken: "access-2",
            accessTokenExpiresAt: "2026-09-24T12:15:00.000Z",
            refreshToken: "refresh-2",
            refreshTokenExpiresAt: "2099-01-01T00:00:00.000Z",
            user: { id: "user-1" },
        });
        const res = makeRes();
        await refresh(
            {
                body: { refreshToken: "ignored" },
                cookies: { sripaa_refresh_token: "refresh-1" },
            } as never,
            asRes(res),
        );

        expect(authService.refresh).toHaveBeenCalledWith("refresh-1", {});
        expect(cookies.set.get("sripaa_access_token")?.value).toBe("access-2");
        expect(cookies.set.get("sripaa_refresh_token")?.value).toBe("refresh-2");
    });

    it("logout clears both cookies and works without an authenticated user", async () => {
        const { logout } = await import("../../src/modules/auth/auth.controller.js");
        const res = makeRes();
        await logout({ cookies: { sripaa_refresh_token: "refresh-1" } } as never, asRes(res));

        expect(authService.logout).toHaveBeenCalledWith(
            "refresh-1",
            {},
            {
                userId: "user-1",
                sessionId: "session-1",
            },
        );
        expect(cookies.cleared.map((c) => c.name).sort()).toEqual([
            "sripaa_access_token",
            "sripaa_refresh_token",
        ]);
    });

    it("change-password preserves the current session", async () => {
        const { changePassword } = await import("../../src/modules/auth/auth.controller.js");
        const res = makeRes();
        await changePassword(
            {
                user: { id: "user-1" },
                authSessionId: "session-1",
                body: { currentPassword: "old-password", newPassword: "new-password12" },
            } as never,
            asRes(res),
        );

        expect(authService.changePassword).toHaveBeenCalledWith(
            "user-1",
            "session-1",
            "old-password",
            "new-password12",
        );
        expect(cookies.cleared).toEqual([]);
    });
});
