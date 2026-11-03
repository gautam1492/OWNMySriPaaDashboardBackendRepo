import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    loanRepaymentListQuery,
    loanRepaymentSchema,
    loanRepaymentPatchSchema,
} from "./loan-repayment.validator.js";

export type LoanRepaymentListQuery = z.infer<typeof loanRepaymentListQuery>;
export type LoanRepaymentInput = z.infer<typeof loanRepaymentSchema>;
export type LoanRepaymentPatchInput = z.infer<typeof loanRepaymentPatchSchema>;
export type { AuthUser, RequestMeta };
