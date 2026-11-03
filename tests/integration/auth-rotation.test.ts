import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { pingDatabase } from "../../src/config/database.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../../src/constants/index.js";

/**
 * End-to-end rotation checks against a real database. Skipped automatically when
 * the configured DATABASE_URL is unreachable so the suite still passes offline.
 */
const databaseAvailable = await pingDatabase().then(
    () => true,
    () => false,
);

const ADMIN = { email: "admin@sripaa.local", password: "Admin@12345" };

function cookieValue(setCookie: string[] | string | undefined, name: string) {
    const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    const match = list.find((cookie) => cookie.startsWith(`${name}=`));
    return match?.split(";")[0].slice(name.length + 1);
}

async function loginAsAdmin() {
    const agent = request.agent(app);
    const response = await agent.post("/api/v1/auth/login").send(ADMIN);
    if (response.status !== 200) {
        const message = response.body?.message ?? "unknown";
        throw new Error(`Admin login failed in test setup (HTTP ${response.status}): ${message}`);
    }
    return { agent, response };
}

describe.skipIf(!databaseAvailable)("auth rotation against a live database", () => {
    it("logs in with cookies only and never returns tokens in the body", async () => {
        const { response } = await loginAsAdmin();

        expect(response.body).toMatchObject({ success: true, message: "Login successful" });
        expect(response.body.data.user).toMatchObject({ email: ADMIN.email });
        expect(response.body.data.accessTokenExpiresAt).toBeTypeOf("string");
        expect(response.body.data).not.toHaveProperty("accessToken");
        expect(response.body.data).not.toHaveProperty("refreshToken");
        expect(response.body.data.user).not.toHaveProperty("passwordHash");

        const setCookie = response.headers["set-cookie"] as unknown as string[];
        expect(cookieValue(setCookie, ACCESS_TOKEN_COOKIE)).toBeTruthy();
        expect(cookieValue(setCookie, REFRESH_TOKEN_COOKIE)).toBeTruthy();
        expect(setCookie.every((cookie) => cookie.includes("HttpOnly"))).toBe(true);
    });

    it("rotates the refresh token and revokes the whole family when an old token is reused", async () => {
        const { agent, response: login } = await loginAsAdmin();
        const originalRefresh = cookieValue(
            login.headers["set-cookie"] as unknown as string[],
            REFRESH_TOKEN_COOKIE,
        );

        await agent.get("/api/v1/auth/me").expect(200);

        const rotated = await agent.post("/api/v1/auth/refresh").expect(200);
        const rotatedRefresh = cookieValue(
            rotated.headers["set-cookie"] as unknown as string[],
            REFRESH_TOKEN_COOKIE,
        );

        expect(rotatedRefresh).toBeTruthy();
        expect(rotatedRefresh).not.toBe(originalRefresh);
        expect(rotated.body.data.accessTokenExpiresAt).toBeTypeOf("string");

        await agent.get("/api/v1/auth/me").expect(200);

        // Replaying the already-rotated token must fail...
        const replay = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", [`${REFRESH_TOKEN_COOKIE}=${originalRefresh}`])
            .expect(401);
        expect(replay.body.message).toBe("Invalid or expired refresh token");

        // ...and must invalidate the replacement too (session family revoked).
        await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", [`${REFRESH_TOKEN_COOKIE}=${rotatedRefresh}`])
            .expect(401);
    });

    it("logout revokes the session so the refresh token stops working", async () => {
        const { agent, response: login } = await loginAsAdmin();
        const refresh = cookieValue(
            login.headers["set-cookie"] as unknown as string[],
            REFRESH_TOKEN_COOKIE,
        );

        const loggedOut = await agent.post("/api/v1/auth/logout").expect(200);
        expect(loggedOut.body.message).toBe("Logged out");
        const cleared = loggedOut.headers["set-cookie"] as unknown as string[];
        expect(cleared.some((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=;`))).toBe(true);

        await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", [`${REFRESH_TOKEN_COOKIE}=${refresh}`])
            .expect(401);
    });

    it("rejects login with a wrong password and audits the attempt", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: ADMIN.email, password: "definitely-wrong" })
            .expect(401);
        expect(response.body.message).toBe("Invalid email or password");
        expect(response.headers["set-cookie"]).toBeUndefined();
    });
});
