import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    feedbackListQuery,
    feedbackPatchSchema,
    feedbackSchema,
} from "./feedback.validator.js";

export type FeedbackListQuery = z.infer<typeof feedbackListQuery>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackPatchInput = z.infer<typeof feedbackPatchSchema>;
export type { AuthUser, RequestMeta };
