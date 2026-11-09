import { z } from "zod";
import { nonFutureDateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

const saleItem = z.object({
    itemId: id,
    unitSold: z.coerce.number().int().min(1).max(100000),
    unitPrice: z.coerce.number().min(0).max(999999999.99),
});

export const saleListQuery = listQuerySchema;

export const saleSchema = z.object({
    date: nonFutureDateString,
    branchId: id,
    entryType: z.enum(["OTC", "DOCTOR_PRESCRIBED_MEDICINE"]),
    items: z.array(saleItem).min(1).max(100),
    gstPercentage: z.coerce.number().min(0).max(100).optional(),
    sgstPercentage: z.coerce.number().min(0).max(100).optional(),
}).superRefine((values, context) => {
    if ((values.gstPercentage ?? 0) + (values.sgstPercentage ?? 0) > 100) {
        context.addIssue({
            code: "custom",
            path: ["sgstPercentage"],
            message: "Combined GST and SGST rates cannot exceed 100%.",
        });
    }
});
