import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CoreInvestmentWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.coreInvestment.findMany({
            where: params.where,
            include: { branch: true },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.coreInvestment.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.coreInvestment.findUnique({ where: { id }, include: { branch: true } });
}

export async function create(data: Prisma.CoreInvestmentUncheckedCreateInput) {
    return prisma.coreInvestment.create({ data, include: { branch: true } });
}

export async function update(id: string, data: Prisma.CoreInvestmentUncheckedUpdateInput) {
    return prisma.coreInvestment.update({ where: { id }, data, include: { branch: true } });
}

export async function remove(id: string) {
    return prisma.coreInvestment.delete({ where: { id } });
}
