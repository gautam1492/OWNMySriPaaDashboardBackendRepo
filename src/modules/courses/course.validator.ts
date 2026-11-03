import { z } from "zod";

const id = z.string().min(1);

export const courseListQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    courseDoctorId: id.optional(),
    isActive: z.coerce.boolean().optional(),
});

export const courseSchema = z.object({
    name: z.string().trim().min(1).max(160),
    courseDoctorId: id,
    isActive: z.boolean().optional(),
});

export const coursePatchSchema = courseSchema.partial();
