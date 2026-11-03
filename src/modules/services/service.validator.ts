import { z } from "zod";

export const serviceSchema = z.object({
    name: z.string().trim().min(2).max(160),
    type: z.enum(["CONSULTATION", "THERAPY", "OTHER"]),
    isActive: z.boolean().optional(),
});

export const servicePatchSchema = serviceSchema.partial();
