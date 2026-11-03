import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CsrFundWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.csrFund.findMany({
            where: params.where,
            orderBy: [{ year: "desc" }, { month: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.csrFund.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.csrFund.findUnique({ where: { id } });
}

export async function create(data: Prisma.CsrFundUncheckedCreateInput) {
    return prisma.csrFund.create({ data });
}

export async function update(id: string, data: Prisma.CsrFundUncheckedUpdateInput) {
    return prisma.csrFund.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.csrFund.delete({ where: { id } });
}
