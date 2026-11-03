import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { errorHandler } from "../../src/middlewares/error.middleware.js";
import { ApiError } from "../../src/utils/ApiError.js";
import { HTTP_STATUS } from "../../src/constants/httpStatus.js";
import { MESSAGES } from "../../src/constants/messages.js";

function runHandler(error: unknown) {
    const json = vi.fn<(body: unknown) => unknown>((body) => body);
    const status = vi.fn<(code: number) => { json: typeof json }>(() => ({ json }));
    const req = { id: "test-request", log: { error: vi.fn(), debug: vi.fn() } };
    errorHandler(error, req as never, { status } as never, vi.fn() as never);
    return {
        statusCode: status.mock.calls[0]?.[0] as number,
        body: json.mock.calls[0]?.[0] as never,
    };
}

describe("errorHandler", () => {
    it("returns 503 with a clean message when the database is unreachable", () => {
        const { statusCode, body } = runHandler(
            new Prisma.PrismaClientInitializationError("Can't reach database server", "P1001"),
        );
        expect(statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(body).toEqual({ success: false, message: MESSAGES.DATABASE_UNAVAILABLE });
        expect(JSON.stringify(body)).not.toContain("prisma");
    });

    it("returns 503 for every connection-level Prisma code", () => {
        for (const code of ["P1000", "P1001", "P1002", "P1003", "P1008", "P1017"]) {
            const { statusCode } = runHandler(
                new Prisma.PrismaClientKnownRequestError("connection problem", {
                    code,
                    clientVersion: "test",
                }),
            );
            expect(statusCode, `code ${code}`).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        }
    });

    it("keeps 409 for duplicate records", () => {
        const { statusCode, body } = runHandler(
            new Prisma.PrismaClientKnownRequestError("unique constraint", {
                code: "P2002",
                clientVersion: "test",
            }),
        );
        expect(statusCode).toBe(HTTP_STATUS.CONFLICT);
        expect(body).toEqual({ success: false, message: MESSAGES.DUPLICATE_RECORD });
    });

    it("keeps ApiError and ZodError behaviour", () => {
        const apiError = runHandler(new ApiError(HTTP_STATUS.NOT_FOUND, "Nope"));
        expect(apiError.statusCode).toBe(HTTP_STATUS.NOT_FOUND);

        const zodError = runHandler(new ZodError([]));
        expect(zodError.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE);
    });
});
