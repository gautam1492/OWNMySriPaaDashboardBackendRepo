import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const coreInvestmentListQuery = listQuerySchema.extend({
    branchId: id.optional(),
    belongsTo: z.enum(["COMPANY", "BRANCH"]).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    billingStartDate: dateString.optional(),
    billingEndDate: dateString.optional(),
    paymentStartDate: dateString.optional(),
    paymentEndDate: dateString.optional(),
});

export const coreInvestmentSchema = z.object({
    itemName: z.string().trim().min(1).max(160),
    invoiceId: z.string().trim().min(1).max(80),
    price: z.coerce.number().min(0).max(999999999.99),
    billingDate: dateString,
    paymentDate: dateString,
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
    belongsTo: z.enum(["COMPANY", "BRANCH"]),
    branchId: id.optional(),
});

export const coreInvestmentPatchSchema = coreInvestmentSchema.partial();
