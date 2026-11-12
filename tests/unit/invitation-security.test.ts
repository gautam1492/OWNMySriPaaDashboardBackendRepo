import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";

const { findUnique, sendEmail } = vi.hoisted(() => ({ findUnique: vi.fn(), sendEmail: vi.fn() }));
vi.mock("../../src/config/database.js", () => ({ prisma: { userInvitation: { findUnique } } }));
vi.mock("../../src/config/email.js", () => ({ sendEmail }));
vi.mock("../../src/modules/audit/audit.service.js", () => ({ writeAudit: vi.fn() }));

import { getPublicInvitation, accept } from "../../src/modules/users/invitation.service.js";
import { sendUserInvitation } from "../../src/modules/users/invitation-email.service.js";
import {
    inspectInvitationSchema,
    acceptInvitationWithTokenSchema,
} from "../../src/modules/users/invitation.validator.js";

beforeEach(() => vi.clearAllMocks());
const token = crypto.randomBytes(32).toString("base64url");

describe("invitation link security", () => {
    it("accepts generated tokens and rejects malformed or oversized tokens", () => {
        expect(inspectInvitationSchema.safeParse({ token }).success).toBe(true);
        for (const value of ["", "short", "a".repeat(44), "../".repeat(15)]) {
            expect(inspectInvitationSchema.safeParse({ token: value }).success).toBe(false);
        }
        expect(
            acceptInvitationWithTokenSchema.safeParse({
                token,
                name: "Test User",
                password: "valid-password",
            }).success,
        ).toBe(true);
    });
    it("rejects malformed legacy tokens before accessing the database", async () => {
        await expect(getPublicInvitation("invalid")).rejects.toMatchObject({ statusCode: 404 });
        await expect(
            accept("invalid", { name: "Test", password: "password123" }),
        ).rejects.toMatchObject({ statusCode: 404 });
        expect(findUnique).not.toHaveBeenCalled();
    });
    for (const status of ["ACCEPTED", "REVOKED", "EXPIRED"]) {
        it(`does not expose personal details for ${status} links`, async () => {
            findUnique.mockResolvedValue({
                status,
                email: "private@example.com",
                invitedName: "Private",
                expiresAt: new Date(0),
            });
            expect(await getPublicInvitation(token)).toEqual({ valid: false, status });
            expect(findUnique.mock.calls[0][0].where.tokenHash).toBe(
                crypto.createHash("sha256").update(token).digest("hex"),
            );
        });
    }
    it("places new email tokens in the fragment, not the request path or query", async () => {
        sendEmail.mockResolvedValue("message-id");
        await sendUserInvitation({
            token,
            email: "test@example.com",
            invitedName: "Test",
            roleName: "DATA_ENTRY",
            inviterName: "Admin",
            inviterEmail: "admin@example.com",
            branchNames: ["Clinic"],
            expiresAt: new Date(),
        });
        const email = sendEmail.mock.calls[0][0];
        const url = new URL(email.text.match(/Accept your invitation: (\S+)/)[1]);
        expect(url.pathname).toBe("/accept-invitation");
        expect(url.search).toBe("");
        expect(url.hash).toBe(`#${token}`);
        expect(email.html).toContain(url.toString());
    });
});
