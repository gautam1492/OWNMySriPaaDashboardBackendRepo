import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    cardSaleListQuery,
    cardSaleSchema,
    cardSalePatchSchema,
} from "./card-sale.validator.js";

export type CardSaleListQuery = z.infer<typeof cardSaleListQuery>;
export type CardSaleInput = z.infer<typeof cardSaleSchema>;
export type CardSalePatchInput = z.infer<typeof cardSalePatchSchema>;
export type { AuthUser, RequestMeta };
