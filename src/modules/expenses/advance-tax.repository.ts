import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.AdvanceTaxWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.advanceTax.findMany({
            where: params.where,
            orderBy: [{ year: "desc" }, { month: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.advanceTax.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.advanceTax.findUnique({ where: { id } });
}

export async function create(data: Prisma.AdvanceTaxUncheckedCreateInput) {
    return prisma.advanceTax.create({ data });
}

export async function update(id: string, data: Prisma.AdvanceTaxUncheckedUpdateInput) {
    return prisma.advanceTax.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.advanceTax.delete({ where: { id } });
}
