import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    miscellaneousExpenseListQuery,
    miscellaneousExpenseSchema,
    miscellaneousExpensePatchSchema,
} from "./miscellaneous-expense.validator.js";

export type MiscellaneousExpenseListQuery = z.infer<typeof miscellaneousExpenseListQuery>;
export type MiscellaneousExpenseInput = z.infer<typeof miscellaneousExpenseSchema>;
export type MiscellaneousExpensePatchInput = z.infer<typeof miscellaneousExpensePatchSchema>;
export type { AuthUser, RequestMeta };
