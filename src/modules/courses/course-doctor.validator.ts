import { z } from "zod";

export const courseDoctorListQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
});

export const courseDoctorSchema = z.object({
    name: z.string().trim().min(1).max(160),
    isActive: z.boolean().optional(),
});

export const courseDoctorPatchSchema = courseDoctorSchema.partial();
