import { z } from "zod";
import { dateString } from "../../utils/dates.js";

export const periodQuery = z.object({
    period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    branchId: z.string().min(1).optional(),
});
