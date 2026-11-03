import { z } from "zod";
import { MAX_PAGE_SIZE } from "../constants/index.js";
import { dateString } from "./dates.js";

export const paginationSchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
    })
    .passthrough();

export const listQuerySchema = paginationSchema.extend({
    search: z.string().max(100).optional(),
    branchId: z.string().min(1).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    entryType: z.enum(["OTC", "DOCTOR_PRESCRIBED_MEDICINE"]).optional(),
});

export function paginationMeta(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function parsePagination(input: { page?: unknown; limit?: unknown }) {
    const page = Math.max(1, Number(input.page ?? 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(input.limit ?? 20)));
    return { page: Number.isFinite(page) ? page : 1, limit: Number.isFinite(limit) ? limit : 20 };
}
