import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

export const miscellaneousExpenseListQuery = listQuerySchema.extend({
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

export const miscellaneousExpenseSchema = z.object({
    itemName: z.string().trim().min(1).max(160),
    voucherId: z.string().trim().min(1).max(80),
    price: z.coerce.number().min(0).max(999999999.99),
    date: dateString,
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
    paymentMethod: z.enum(["ONLINE", "CASH"]),
});

export const miscellaneousExpensePatchSchema = miscellaneousExpenseSchema.partial();
