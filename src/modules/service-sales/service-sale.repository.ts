import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const include = { branch: true, service: true } as const;

export async function list(params: {
    where: Prisma.ServiceSaleWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.serviceSale.findMany({
            where: params.where,
            include,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.serviceSale.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.serviceSale.findUnique({ where: { id }, include });
}

export async function create(data: Prisma.ServiceSaleCreateInput) {
    return prisma.serviceSale.create({ data, include });
}

export async function update(id: string, data: Prisma.ServiceSaleUpdateInput) {
    return prisma.serviceSale.update({ where: { id }, data, include });
}

export async function remove(id: string) {
    return prisma.serviceSale.delete({ where: { id } });
}
