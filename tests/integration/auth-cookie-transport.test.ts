import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../../src/constants/index.js";
import { signAccessToken } from "../../src/modules/auth/auth.service.js";
import type { AuthUser } from "../../src/types/common.types.js";

const staffUser: AuthUser = {
    id: "test-user-1",
    name: "Cookie Staff",
    email: "cookie.staff@sripaa.local",
    roleId: "test-role-1",
    branchIds: ["test-branch-1"],
    permissions: [],
    role: "DATA_ENTRY",
};

const adminUser: AuthUser = { ...staffUser, role: "ADMIN", branchIds: [] };

function accessCookie(user: AuthUser) {
    return `${ACCESS_TOKEN_COOKIE}=${signAccessToken(user)}`;
}

describe("auth cookie transport (HTTP level)", () => {
    it("rejects requests with no auth cookie", async () => {
        const response = await request(app).get("/api/v1/auth/me");
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it("ignores Authorization: Bearer headers (cookie-only auth)", async () => {
        const response = await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${signAccessToken(adminUser)}`);
        expect(response.status).toBe(401);
    });

    it("authenticates from the access cookie and returns the user", async () => {
        const response = await request(app)
            .get("/api/v1/auth/me")
            .set("Cookie", [accessCookie(staffUser)]);
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ id: "test-user-1", role: "DATA_ENTRY" });
        expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    it("rejects a tampered access cookie", async () => {
        const response = await request(app)
            .get("/api/v1/auth/me")
            .set("Cookie", [`${ACCESS_TOKEN_COOKIE}=not.a.jwt`]);
        expect(response.status).toBe(401);
    });

    it("applies role guards on top of cookie auth (staff cannot read audit logs)", async () => {
        const response = await request(app)
            .get("/api/v1/audit")
            .set("Cookie", [accessCookie(staffUser)]);
        expect(response.status).toBe(403);
    });

    it("logout without any session still succeeds and clears both cookies", async () => {
        const response = await request(app).post("/api/v1/auth/logout");
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Logged out");
        const cleared = response.headers["set-cookie"] as unknown as string[];
        expect(cleared.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=;`))).toBe(true);
        expect(cleared.some((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=;`))).toBe(true);
    });

    it("refresh without the refresh cookie returns 401 Refresh token required", async () => {
        const response = await request(app).post("/api/v1/auth/refresh");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Refresh token required");
    });
});
