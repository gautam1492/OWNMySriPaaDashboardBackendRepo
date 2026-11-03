import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

export const csrFundListQuery = listQuerySchema.extend({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2023).optional(),
});

export const csrFundSchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2023),
    lastMonthTotalIncome: z.coerce.number().min(0).max(999999999.99),
    percentage: z.coerce.number().min(0).max(100),
    amount: z.coerce.number().min(0).max(999999999.99),
});

export const csrFundPatchSchema = csrFundSchema.partial();
