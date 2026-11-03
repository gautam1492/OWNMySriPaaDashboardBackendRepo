import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const directorSalaryListQuery = listQuerySchema.extend({
    directorId: id.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2023).optional(),
});

export const directorSalarySchema = z.object({
    directorId: id,
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2023),
    amount: z.coerce.number().min(0).max(999999999.99),
});

export const directorSalaryPatchSchema = directorSalarySchema.partial();
