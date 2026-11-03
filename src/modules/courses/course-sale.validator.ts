import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const courseSaleListQuery = listQuerySchema.extend({
    courseId: id.optional(),
    courseDoctorId: id.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

export const courseSaleSchema = z.object({
    courseId: id,
    courseDoctorId: id,
    purchaseDate: dateString,
    numberOfCourses: z.coerce.number().int().min(1),
    pricePerCourse: z.coerce.number().min(0).max(999999999.99),
    discount: z.coerce.number().min(0).max(999999999.99).optional().default(0),
    customerId: z.string().min(1).max(160),
    membershipType: z.enum(["GREEN_CARD", "GOLDEN_CARD", "OTHER"]),
});

export const courseSalePatchSchema = courseSaleSchema.partial();
