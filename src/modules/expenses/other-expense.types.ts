import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    otherExpenseListQuery,
    otherExpenseSchema,
    otherExpensePatchSchema,
} from "./other-expense.validator.js";

export type OtherExpenseListQuery = z.infer<typeof otherExpenseListQuery>;
export type OtherExpenseInput = z.infer<typeof otherExpenseSchema>;
export type OtherExpensePatchInput = z.infer<typeof otherExpensePatchSchema>;
export type { AuthUser, RequestMeta };
