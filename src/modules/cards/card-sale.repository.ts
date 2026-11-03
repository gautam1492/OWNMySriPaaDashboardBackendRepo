import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CardSaleWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.cardSale.findMany({
            where: params.where,
            include: { cardType: true },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.cardSale.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.cardSale.findUnique({ where: { id }, include: { cardType: true } });
}

export async function create(data: Prisma.CardSaleUncheckedCreateInput) {
    return prisma.cardSale.create({ data, include: { cardType: true } });
}

export async function update(id: string, data: Prisma.CardSaleUncheckedUpdateInput) {
    return prisma.cardSale.update({ where: { id }, data, include: { cardType: true } });
}

export async function remove(id: string) {
    return prisma.cardSale.delete({ where: { id } });
}
