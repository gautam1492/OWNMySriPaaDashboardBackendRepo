import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { branchExpenseListQuery } from "./branch-expense.validator.js";

export type BranchExpenseListQuery = z.infer<typeof branchExpenseListQuery>;
export type { AuthUser, RequestMeta };
