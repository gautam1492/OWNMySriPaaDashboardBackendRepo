import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const cardSaleListQuery = listQuerySchema.extend({
    cardTypeId: id.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

export const cardSaleSchema = z.object({
    cardTypeId: id,
    date: dateString,
    cardPrice: z.coerce.number().min(0).max(999999999.99),
    numberOfCards: z.coerce.number().int().min(1),
});

export const cardSalePatchSchema = cardSaleSchema.partial();
