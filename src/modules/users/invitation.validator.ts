import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";
import { mobileNumberSchema } from "../../utils/mobile-number.js";

const id = z.string().min(1);
export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const inspectInvitationSchema = z.object({ token: invitationTokenSchema });

export const invitationListQuery = listQuerySchema.extend({
    status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]).optional(),
});

export const createInvitationSchema = z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(255),
    roleId: id,
    branchIds: z.array(id).max(50).default([]),
});

export const acceptInvitationSchema = z.object({
    name: z.string().trim().min(2).max(160),
    password: z.string().min(8).max(128),
    mobileNumber: mobileNumberSchema,
});
export const acceptInvitationWithTokenSchema = acceptInvitationSchema.extend({
    token: invitationTokenSchema,
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationListQuery = z.infer<typeof invitationListQuery>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
