import { z } from "zod";

export const cardTypeListQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
});

export const cardTypeSchema = z.object({
    name: z.string().trim().min(1).max(160),
    defaultPrice: z.coerce.number().min(0).max(999999999.99),
    isActive: z.boolean().optional(),
});

export const cardTypePatchSchema = cardTypeSchema.partial();
