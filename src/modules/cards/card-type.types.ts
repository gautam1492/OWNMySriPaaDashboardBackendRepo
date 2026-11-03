import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    cardTypeListQuery,
    cardTypeSchema,
    cardTypePatchSchema,
} from "./card-type.validator.js";

export type CardTypeListQuery = z.infer<typeof cardTypeListQuery>;
export type CardTypeInput = z.infer<typeof cardTypeSchema>;
export type CardTypePatchInput = z.infer<typeof cardTypePatchSchema>;
export type { AuthUser, RequestMeta };
