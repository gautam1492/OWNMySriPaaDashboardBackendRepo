import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const feedbackListQuery = listQuerySchema;

export const feedbackSchema = z.object({
    date: dateString,
    branchId: id,
    doctor: z.string().trim().min(1).max(160),
    service: z.string().trim().min(1).max(160),
    patientType: z.enum(["OPD", "IPD"]),
    filledBy: z.enum(["PATIENT_SELF", "STAFF"]),
    frontdeskRating: z.coerce.number().int().min(1).max(5),
    posttreatmentRating: z.coerce.number().int().min(1).max(5),
    comments: z.string().max(5000).optional().nullable(),
});

export const feedbackPatchSchema = feedbackSchema.partial();
