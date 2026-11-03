import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

export const auditListQuery = listQuerySchema.extend({
    action: z.string().max(120).optional(),
    resourceType: z.string().max(80).optional(),
    resourceId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
});
