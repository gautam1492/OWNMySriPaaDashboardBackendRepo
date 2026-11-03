import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const serviceSaleListQuery = listQuerySchema
    .omit({ entryType: true })
    .extend({ serviceType: z.enum(["CONSULTATION", "THERAPY", "OTHER"]).optional() });

export const serviceSaleSchema = z.object({
    date: dateString,
    branchId: id,
    serviceType: z.enum(["CONSULTATION", "THERAPY", "OTHER"]),
    serviceId: id,
    amount: z.coerce.number().min(0).max(999999999.99),
});
