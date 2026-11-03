import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    courseSaleListQuery,
    courseSaleSchema,
    courseSalePatchSchema,
} from "./course-sale.validator.js";

export type CourseSaleListQuery = z.infer<typeof courseSaleListQuery>;
export type CourseSaleInput = z.infer<typeof courseSaleSchema>;
export type CourseSalePatchInput = z.infer<typeof courseSalePatchSchema>;
export type { AuthUser, RequestMeta };
