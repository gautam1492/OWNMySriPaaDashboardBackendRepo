import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";
import { mobileNumberSchema } from "../../utils/mobile-number.js";

const id = z.string().min(1);

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

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationListQuery = z.infer<typeof invitationListQuery>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
