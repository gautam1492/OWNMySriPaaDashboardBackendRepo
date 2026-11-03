import { prisma } from "../../config/database.js";

export async function findById(id: string) {
    return prisma.branch.findUnique({ where: { id } });
}

export async function findActiveMany() {
    return prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function findActiveByIds(ids: string[]) {
    if (!ids.length) return [];
    return prisma.branch.findMany({
        where: { id: { in: ids }, isActive: true },
        orderBy: { name: "asc" },
    });
}

export async function findActiveByCodes(codes: string[]) {
    return prisma.branch.findMany({
        where: { code: { in: codes }, isActive: true },
        select: { id: true, name: true, code: true },
    });
}

export async function create(data: { name: string; code: string }) {
    return prisma.branch.create({ data });
}

export async function remove(id: string) {
    return prisma.branch.delete({ where: { id } });
}
