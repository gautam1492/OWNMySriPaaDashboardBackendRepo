import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

export const marketingExpenseListQuery = listQuerySchema.extend({
    expenseMonth: z.coerce.number().int().min(1).max(12).optional(),
    expenseYear: z.coerce.number().int().min(2023).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    billingStartDate: dateString.optional(),
    billingEndDate: dateString.optional(),
    paymentStartDate: dateString.optional(),
    paymentEndDate: dateString.optional(),
});

export const marketingExpenseSchema = z.object({
    companyName: z.string().trim().min(1).max(160),
    invoiceId: z.string().trim().min(1).max(80),
    price: z.coerce.number().min(0).max(999999999.99),
    billingDate: dateString,
    paymentDate: dateString,
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
    expenseMonth: z.coerce.number().int().min(1).max(12),
    expenseYear: z.coerce.number().int().min(2023),
});

export const marketingExpensePatchSchema = marketingExpenseSchema.partial();
