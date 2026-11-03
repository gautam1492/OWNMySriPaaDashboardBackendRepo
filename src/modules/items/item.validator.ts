import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

export const itemListQuery = listQuerySchema.extend({
    type: z.enum(["MEDICINE", "OTC"]).optional(),
});

export const itemSchema = z.object({
    name: z.string().trim().min(2).max(160),
    type: z.enum(["MEDICINE", "OTC"]),
    isActive: z.boolean().optional(),
});

export const itemPatchSchema = itemSchema.partial();

export const itemImportSchema = z.object({
    items: z
        .array(
            z.object({
                name: z.string().trim().min(2).max(160),
                type: z.enum(["MEDICINE", "OTC"]),
            }),
        )
        .min(1)
        .max(2000),
    isActive: z.boolean(),
});
