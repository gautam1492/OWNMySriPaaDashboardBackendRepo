import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type {
    courseDoctorListQuery,
    courseDoctorSchema,
    courseDoctorPatchSchema,
} from "./course-doctor.validator.js";

export type CourseDoctorListQuery = z.infer<typeof courseDoctorListQuery>;
export type CourseDoctorInput = z.infer<typeof courseDoctorSchema>;
export type CourseDoctorPatchInput = z.infer<typeof courseDoctorPatchSchema>;
export type { AuthUser, RequestMeta };
