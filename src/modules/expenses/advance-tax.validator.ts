import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

export const advanceTaxListQuery = listQuerySchema.extend({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2023).optional(),
});

export const advanceTaxSchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2023),
    amountPaid: z.coerce.number().min(0).max(999999999.99),
});

export const advanceTaxPatchSchema = advanceTaxSchema.partial();
