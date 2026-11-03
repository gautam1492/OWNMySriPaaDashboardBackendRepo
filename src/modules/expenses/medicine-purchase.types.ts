import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    medicinePurchaseListQuery,
    medicinePurchaseSchema,
    medicinePurchasePatchSchema,
} from "./medicine-purchase.validator.js";

export type MedicinePurchaseListQuery = z.infer<typeof medicinePurchaseListQuery>;
export type MedicinePurchaseInput = z.infer<typeof medicinePurchaseSchema>;
export type MedicinePurchasePatchInput = z.infer<typeof medicinePurchasePatchSchema>;
export type { AuthUser, RequestMeta };
