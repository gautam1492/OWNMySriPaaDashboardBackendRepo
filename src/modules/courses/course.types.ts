import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { courseListQuery, courseSchema, coursePatchSchema } from "./course.validator.js";

export type CourseListQuery = z.infer<typeof courseListQuery>;
export type CourseInput = z.infer<typeof courseSchema>;
export type CoursePatchInput = z.infer<typeof coursePatchSchema>;
export type { AuthUser, RequestMeta };
