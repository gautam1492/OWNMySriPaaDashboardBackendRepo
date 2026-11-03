import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.OtherExpenseWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.otherExpense.findMany({
            where: params.where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.otherExpense.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.otherExpense.findUnique({ where: { id } });
}

export async function create(data: Prisma.OtherExpenseUncheckedCreateInput) {
    return prisma.otherExpense.create({ data });
}

export async function update(id: string, data: Prisma.OtherExpenseUncheckedUpdateInput) {
    return prisma.otherExpense.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.otherExpense.delete({ where: { id } });
}
