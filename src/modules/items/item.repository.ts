import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: { where: Prisma.ItemWhereInput; skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
        prisma.item.findMany({
            where: params.where,
            orderBy: { name: "asc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.item.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.item.findUnique({ where: { id } });
}

export async function findActiveByIds(ids: string[]) {
    return prisma.item.findMany({ where: { id: { in: ids }, isActive: true } });
}

export async function create(data: Prisma.ItemUncheckedCreateInput) {
    return prisma.item.create({ data });
}

export async function createMany(data: Prisma.ItemCreateManyInput[]) {
    return prisma.item.createMany({ data, skipDuplicates: true });
}

export async function update(id: string, data: Prisma.ItemUncheckedUpdateInput) {
    return prisma.item.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.item.delete({ where: { id } });
}
