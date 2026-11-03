import { z } from "zod";
import { listQuerySchema } from "../../utils/pagination.js";

const id = z.string().min(1);

export const userListQuery = listQuerySchema;

export const userCreateSchema = z.object({
    name: z.string().min(2).max(160),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    roleId: id,
    branchIds: z.array(id).max(50).optional(),
    mobileNumber: z.string().max(30).optional().nullable(),
});

export const userPatchSchema = userCreateSchema
    .partial()
    .omit({ password: true })
    .extend({ isActive: z.boolean().optional() });

export const userStatusSchema = z.object({ isActive: z.boolean() });
export const userRoleSchema = z.object({ roleId: id });
export const userBranchesSchema = z.object({ branchIds: z.array(id).max(50) });

export const permissionGrantSchema = z.object({
    permissionKeys: z
        .array(
            z
                .string()
                .min(1)
                .max(120)
                .regex(
                    /^(workspace\.read|(users|branches|items|services|sales|serviceSales|visits|feedback|courses|cards|coreInvestments|medicinePurchases|marketingExpenses|csrFunds|loans|loanRepayments|advanceTaxes|otherExpenses|directorSalaries|miscellaneousExpenses|branchExpenses|directors)\.(read|create|update|delete))$/,
                    "Permission key must follow the format {module}.{action} (e.g. sales.read)",
                ),
        )
        .min(1)
        .max(50),
});
