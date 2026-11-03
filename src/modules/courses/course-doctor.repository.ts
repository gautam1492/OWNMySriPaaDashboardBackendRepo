import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CourseDoctorWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.courseDoctor.findMany({
            where: params.where,
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.courseDoctor.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.courseDoctor.findUnique({ where: { id } });
}

export async function create(data: Prisma.CourseDoctorUncheckedCreateInput) {
    return prisma.courseDoctor.create({ data });
}

export async function update(id: string, data: Prisma.CourseDoctorUncheckedUpdateInput) {
    return prisma.courseDoctor.update({ where: { id }, data });
}

export async function remove(id: string) {
    return prisma.courseDoctor.delete({ where: { id } });
}
