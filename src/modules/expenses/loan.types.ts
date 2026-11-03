import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { loanListQuery, loanSchema, loanPatchSchema } from "./loan.validator.js";

export type LoanListQuery = z.infer<typeof loanListQuery>;
export type LoanInput = z.infer<typeof loanSchema>;
export type LoanPatchInput = z.infer<typeof loanPatchSchema>;
export type { AuthUser, RequestMeta };
