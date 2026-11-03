import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { visitListQuery, visitPatchSchema, visitSchema } from "./patient-visit.validator.js";

export type VisitListQuery = z.infer<typeof visitListQuery>;
export type VisitInput = z.infer<typeof visitSchema>;
export type VisitPatchInput = z.infer<typeof visitPatchSchema>;
export type { AuthUser, RequestMeta };
