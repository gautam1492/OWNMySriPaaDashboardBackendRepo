import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CardTypeWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.cardType.findMany({
            where: params.where,
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.cardType.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.cardType.findUnique({ where: { id } });
}

export async function create(data: Prisma.CardTypeUncheckedCreateInput) {
    return prisma.cardType.create({ data });
}

export async function update(id: string, data: Prisma.CardTypeUncheckedUpdateInput) {
    return prisma.cardType.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.cardType.delete({ where: { id } });
}
