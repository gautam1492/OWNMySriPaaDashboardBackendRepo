import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    advanceTaxListQuery,
    advanceTaxSchema,
    advanceTaxPatchSchema,
} from "./advance-tax.validator.js";

export type AdvanceTaxListQuery = z.infer<typeof advanceTaxListQuery>;
export type AdvanceTaxInput = z.infer<typeof advanceTaxSchema>;
export type AdvanceTaxPatchInput = z.infer<typeof advanceTaxPatchSchema>;
export type { AuthUser, RequestMeta };
