import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { csrFundListQuery, csrFundSchema, csrFundPatchSchema } from "./csr-fund.validator.js";

export type CsrFundListQuery = z.infer<typeof csrFundListQuery>;
export type CsrFundInput = z.infer<typeof csrFundSchema>;
export type CsrFundPatchInput = z.infer<typeof csrFundPatchSchema>;
export type { AuthUser, RequestMeta };
