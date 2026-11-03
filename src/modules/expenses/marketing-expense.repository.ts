import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.MarketingExpenseWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.marketingExpense.findMany({
            where: params.where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.marketingExpense.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.marketingExpense.findUnique({ where: { id } });
}

export async function create(data: Prisma.MarketingExpenseUncheckedCreateInput) {
    return prisma.marketingExpense.create({ data });
}

export async function update(id: string, data: Prisma.MarketingExpenseUncheckedUpdateInput) {
    return prisma.marketingExpense.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.marketingExpense.delete({ where: { id } });
}
