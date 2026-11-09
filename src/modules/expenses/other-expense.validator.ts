import { z } from "zod";
import { dateString, nonFutureDateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

export const otherExpenseListQuery = listQuerySchema.extend({
    year: z.coerce.number().int().min(2023).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    billingStartDate: dateString.optional(),
    billingEndDate: dateString.optional(),
    paymentStartDate: dateString.optional(),
    paymentEndDate: dateString.optional(),
});

export const otherExpenseSchema = z.object({
    itemName: z.string().trim().min(1).max(160),
    invoiceId: z.string().trim().min(1).max(80),
    price: z.coerce.number().min(0).max(999999999.99),
    billingDate: nonFutureDateString,
    paymentDate: nonFutureDateString,
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
    year: z.coerce.number().int().min(2023),
});

export const otherExpensePatchSchema = otherExpenseSchema.partial();
