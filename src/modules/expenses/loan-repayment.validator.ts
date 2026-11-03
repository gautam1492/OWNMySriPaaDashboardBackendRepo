import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const loanRepaymentListQuery = listQuerySchema.extend({
    loanId: id.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2023).optional(),
});

export const loanRepaymentSchema = z.object({
    loanId: id,
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2023),
    repaymentAmount: z.coerce.number().min(0).max(999999999.99),
});

export const loanRepaymentPatchSchema = loanRepaymentSchema.partial();
