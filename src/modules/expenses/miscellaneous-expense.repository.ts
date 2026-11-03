import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CompanyMiscellaneousExpenseWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.companyMiscellaneousExpense.findMany({
            where: params.where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.companyMiscellaneousExpense.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.companyMiscellaneousExpense.findUnique({ where: { id } });
}

export async function create(data: Prisma.CompanyMiscellaneousExpenseUncheckedCreateInput) {
    return prisma.companyMiscellaneousExpense.create({ data });
}

export async function update(
    id: string,
    data: Prisma.CompanyMiscellaneousExpenseUncheckedUpdateInput,
) {
    return prisma.companyMiscellaneousExpense.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.companyMiscellaneousExpense.delete({ where: { id } });
}
