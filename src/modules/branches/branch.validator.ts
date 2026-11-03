import { z } from "zod";

export const createBranchSchema = z.object({
    name: z.string().trim().min(1).max(160),
    code: z.string().trim().min(1).max(32),
});
