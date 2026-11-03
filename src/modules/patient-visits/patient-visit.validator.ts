import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const visitListQuery = listQuerySchema;

export const visitSchema = z.object({
    date: dateString,
    branchId: id,
    newPatients: z.coerce.number().int().min(0).max(100000),
    followupPatients: z.coerce.number().int().min(0).max(100000),
});

export const visitPatchSchema = visitSchema.partial();
