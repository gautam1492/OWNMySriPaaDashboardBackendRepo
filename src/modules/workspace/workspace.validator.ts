import { z } from "zod";

export const workspaceSummaryQuery = z.object({
    branchId: z.string().min(1).optional(),
});
