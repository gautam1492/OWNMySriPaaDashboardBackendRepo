import { describe, expect, it } from "vitest";

describe("authenticate middleware (cookie-only)", () => {
    it("accepts the access-token cookie and attaches req.user", async () => {
        const { signAccessToken } = await import("../../src/modules/auth/auth.service.js");
        const { authenticate } = await import("../../src/middlewares/auth.middleware.js");
        const user = {
            id: "user-1",
            name: "Test User",
            email: "test@sripaa.local",
            roleId: "role-1",
            branchIds: ["branch-1"],
            permissions: [],
            role: "ADMIN" as const,
        };
        const token = signAccessToken(user, "test-session-1");
        const req = { cookies: { sripaa_access_token: token } } as never;
        let nextError: unknown;
        authenticate(
            req,
            {} as never,
            ((error?: unknown) => {
                nextError = error;
            }) as never,
        );

        expect(nextError).toBeUndefined();
        expect((req as { user?: unknown }).user).toMatchObject({ id: "user-1", role: "ADMIN" });
    });

    it("rejects requests without the cookie and ignores Authorization headers", async () => {
        const { signAccessToken } = await import("../../src/modules/auth/auth.service.js");
        const { authenticate } = await import("../../src/middlewares/auth.middleware.js");
        const token = signAccessToken({
            id: "user-1",
            name: "Test User",
            email: "test@sripaa.local",
            roleId: "role-1",
            branchIds: [],
            permissions: [],
            role: "ADMIN" as const,
        }, "test-session-1");
        const req = { cookies: {}, header: () => `Bearer ${token}` } as never;
        let nextError: unknown;
        authenticate(
            req,
            {} as never,
            ((error?: unknown) => {
                nextError = error;
            }) as never,
        );

        expect(nextError).toMatchObject({ statusCode: 401 });
        expect((req as { user?: unknown }).user).toBeUndefined();
    });

    it("rejects expired/tampered access tokens", async () => {
        const { authenticate } = await import("../../src/middlewares/auth.middleware.js");
        const req = { cookies: { sripaa_access_token: "not-a-token" } } as never;
        let nextError: unknown;
        authenticate(
            req,
            {} as never,
            ((error?: unknown) => {
                nextError = error;
            }) as never,
        );

        expect(nextError).toMatchObject({ statusCode: 401 });
    });
});
