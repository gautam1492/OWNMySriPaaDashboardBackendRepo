import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.MedicinePurchaseWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.medicinePurchase.findMany({
            where: params.where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.medicinePurchase.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.medicinePurchase.findUnique({ where: { id } });
}

export async function create(data: Prisma.MedicinePurchaseUncheckedCreateInput) {
    return prisma.medicinePurchase.create({ data });
}

export async function update(id: string, data: Prisma.MedicinePurchaseUncheckedUpdateInput) {
    return prisma.medicinePurchase.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.medicinePurchase.delete({ where: { id } });
}
