import { z } from "zod";
import { dateString } from "../../utils/dates.js";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);
const money = z.coerce.number().min(0).max(999999999.99);
const month = z.enum([
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
]);
const taxFields = {
    gst: z.coerce.number().min(0).max(100).default(0),
    sgst: z.coerce.number().min(0).max(100).default(0),
};

export const branchExpenseListQuery = listQuerySchema.extend({
    branchId: id.optional(),
    year: z.coerce.number().int().min(2023).max(2100).optional(),
    month: month.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

export const branchExpenseSchemas = {
    salary: z.object({
        branchId: id,
        personName: z.string().trim().min(1).max(160),
        role: z.string().trim().min(1).max(160),
        month,
        year: z.coerce.number().int().min(2023).max(2100),
        salary: money,
        dateCredited: dateString,
        totalAmount: money,
    }),
    rent: z.object({
        branchId: id,
        month,
        year: z.coerce.number().int().min(2023).max(2100),
        invoiceId: z.string().trim().min(1).max(80),
        rentAmount: money,
        tdsPercentage: z.coerce.number().min(0).max(100),
    }),
    waterBill: z.object({
        branchId: id,
        amount: money,
        billId: z.string().trim().min(1).max(80),
        paidDate: dateString,
        assignedDate: dateString,
        month,
        year: z.coerce.number().int().min(2023).max(2100),
    }),
    powerBill: z.object({
        branchId: id,
        amount: money,
        billId: z.string().trim().min(1).max(80),
        assignedDate: dateString,
        paidDate: dateString,
        month,
        year: z.coerce.number().int().min(2023).max(2100),
    }),
    foodGroceries: z.object({
        branchId: id,
        invoiceId: z.string().trim().min(1).max(80),
        amount: money,
        date: dateString,
        month,
        year: z.coerce.number().int().min(2023).max(2100),
    }),
    governmentFee: z.object({
        branchId: id,
        itemName: z.string().trim().min(1).max(160),
        invoiceId: z.string().trim().min(1).max(80),
        price: money,
        date: dateString,
        ...taxFields,
        year: z.coerce.number().int().min(2023).max(2100),
    }),
    investmentPurchase: z.object({
        branchId: id,
        itemName: z.string().trim().min(1).max(160),
        invoiceId: z.string().trim().min(1).max(80),
        price: money,
        date: dateString,
        ...taxFields,
        year: z.coerce.number().int().min(2023).max(2100),
    }),
    miscellaneous: z.object({
        branchId: id,
        itemName: z.string().trim().min(1).max(160),
        voucherId: z.string().trim().min(1).max(80),
        price: money,
        date: dateString,
        ...taxFields,
        paymentMethod: z.enum(["ONLINE", "CASH"]),
        year: z.coerce.number().int().min(2023).max(2100),
    }),
} as const;

export type BranchExpenseKind = keyof typeof branchExpenseSchemas;
export const branchExpenseKinds = Object.keys(branchExpenseSchemas) as BranchExpenseKind[];
export const branchExpensePatchSchemas = Object.fromEntries(
    Object.entries(branchExpenseSchemas).map(([key, schema]) => [key, schema.partial()]),
) as unknown as Record<BranchExpenseKind, z.ZodType>;
