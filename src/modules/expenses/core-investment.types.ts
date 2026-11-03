import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    coreInvestmentListQuery,
    coreInvestmentSchema,
    coreInvestmentPatchSchema,
} from "./core-investment.validator.js";

export type CoreInvestmentListQuery = z.infer<typeof coreInvestmentListQuery>;
export type CoreInvestmentInput = z.infer<typeof coreInvestmentSchema>;
export type CoreInvestmentPatchInput = z.infer<typeof coreInvestmentPatchSchema>;
export type { AuthUser, RequestMeta };
