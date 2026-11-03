import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: { where: Prisma.CourseWhereInput; skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
        prisma.course.findMany({
            where: params.where,
            include: { courseDoctor: true },
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.course.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.course.findUnique({ where: { id }, include: { courseDoctor: true } });
}

export async function create(data: Prisma.CourseUncheckedCreateInput) {
    return prisma.course.create({ data, include: { courseDoctor: true } });
}

export async function update(id: string, data: Prisma.CourseUncheckedUpdateInput) {
    return prisma.course.update({ where: { id }, data, include: { courseDoctor: true } });
}

export async function remove(id: string) {
    return prisma.course.delete({ where: { id } });
}
