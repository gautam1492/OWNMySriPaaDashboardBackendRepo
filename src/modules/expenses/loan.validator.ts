import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

export const loanListQuery = listQuerySchema.extend({
    isActive: z.coerce.boolean().optional(),
    search: z.string().max(100).optional(),
});

export const loanSchema = z.object({
    name: z.string().trim().min(1).max(160),
    originalAmount: z.coerce.number().min(0).max(999999999.99),
    isActive: z.boolean().optional(),
});

export const loanPatchSchema = loanSchema.partial();
