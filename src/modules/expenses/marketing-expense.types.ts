import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    marketingExpenseListQuery,
    marketingExpenseSchema,
    marketingExpensePatchSchema,
} from "./marketing-expense.validator.js";

export type MarketingExpenseListQuery = z.infer<typeof marketingExpenseListQuery>;
export type MarketingExpenseInput = z.infer<typeof marketingExpenseSchema>;
export type MarketingExpensePatchInput = z.infer<typeof marketingExpensePatchSchema>;
export type { AuthUser, RequestMeta };
