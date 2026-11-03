import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    directorSalaryListQuery,
    directorSalarySchema,
    directorSalaryPatchSchema,
} from "./director-salary.validator.js";

export type DirectorSalaryListQuery = z.infer<typeof directorSalaryListQuery>;
export type DirectorSalaryInput = z.infer<typeof directorSalarySchema>;
export type DirectorSalaryPatchInput = z.infer<typeof directorSalaryPatchSchema>;
export type { AuthUser, RequestMeta };
