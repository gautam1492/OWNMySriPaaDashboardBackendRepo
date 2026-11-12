import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/middlewares/auth.middleware.js", () => ({
    authenticate: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.headers["x-test-user"]) return res.sendStatus(401);
        req.user = { id: String(req.headers["x-test-user"]) } as typeof req.user;
        next();
    },
}));
vi.mock("../../src/modules/auth/auth.controller.js", () => {
    const success = (_req: express.Request, res: express.Response) => res.sendStatus(200);
    return {
        login: (_req: express.Request, res: express.Response) => res.sendStatus(401),
        refresh: success,
        logout: success,
        me: success,
        sessions: success,
        revokeOtherSessions: success,
        revokeAllSessions: success,
        revokeSession: success,
        profile: success,
        updateProfile: success,
        changePassword: success,
        forgotPassword: success,
        resetPassword: success,
    };
});
vi.mock("../../src/middlewares/validation.middleware.js", () => ({
    validate: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
        next(),
}));

beforeEach(() => vi.resetModules());
async function application() {
    const { default: router } = await import("../../src/modules/auth/auth.routes.js");
    return express().use("/auth", router);
}

describe("authentication rate limit isolation", () => {
    it("failed logins cannot exhaust the profile, refresh or logout budgets", async () => {
        const app = await application();
        for (let i = 0; i < 30; i++)
            expect((await request(app).post("/auth/login")).status).toBe(401);
        expect((await request(app).post("/auth/login")).status).toBe(429);
        expect((await request(app).get("/auth/me").set("x-test-user", "one")).status).toBe(200);
        expect((await request(app).post("/auth/refresh")).status).toBe(200);
        expect((await request(app).post("/auth/logout")).status).toBe(200);
    });
    it("routine limits belong to the authenticated user, not the shared IP", async () => {
        const app = await application();
        expect((await request(app).get("/auth/me")).status).toBe(401);
        for (let i = 0; i < 300; i++)
            expect((await request(app).get("/auth/me").set("x-test-user", "one")).status).toBe(200);
        expect((await request(app).get("/auth/me").set("x-test-user", "one")).status).toBe(429);
        expect((await request(app).get("/auth/me").set("x-test-user", "two")).status).toBe(200);
    });
});
