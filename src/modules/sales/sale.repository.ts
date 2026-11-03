import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const include = { items: { include: { item: true } }, branch: true } as const;

export async function list(params: { where: Prisma.SaleWhereInput; skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
        prisma.sale.findMany({
            where: params.where,
            include,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.sale.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.sale.findUnique({ where: { id }, include });
}

export async function create(data: Prisma.SaleCreateInput) {
    return prisma.sale.create({ data, include });
}

export async function replaceItemsAndUpdate(
    id: string,
    data: Prisma.SaleUpdateInput,
    items: Prisma.SaleItemCreateWithoutSaleInput[],
) {
    return prisma.$transaction(async (tx) => {
        await tx.saleItem.deleteMany({ where: { saleId: id } });
        return tx.sale.update({
            where: { id },
            data: { ...data, items: { create: items } },
            include,
        });
    });
}

export async function remove(id: string) {
    return prisma.sale.delete({ where: { id } });
}
