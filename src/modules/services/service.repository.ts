import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function findActiveMany() {
    return prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function findById(id: string) {
    return prisma.service.findUnique({ where: { id } });
}

export async function create(data: Prisma.ServiceUncheckedCreateInput) {
    return prisma.service.create({ data });
}

export async function update(id: string, data: Prisma.ServiceUncheckedUpdateInput) {
    return prisma.service.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.service.delete({ where: { id } });
}
