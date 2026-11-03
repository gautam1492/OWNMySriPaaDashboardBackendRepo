import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

export const medicinePurchaseListQuery = listQuerySchema.extend({
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    billingStartDate: dateString.optional(),
    billingEndDate: dateString.optional(),
    paymentStartDate: dateString.optional(),
    paymentEndDate: dateString.optional(),
});

export const medicinePurchaseSchema = z.object({
    invoiceId: z.string().trim().min(1).max(80),
    price: z.coerce.number().min(0).max(999999999.99),
    billingDate: dateString,
    paymentDate: dateString,
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
});

export const medicinePurchasePatchSchema = medicinePurchaseSchema.partial();
