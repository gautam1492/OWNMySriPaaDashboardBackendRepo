import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.CourseSaleWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.courseSale.findMany({
            where: params.where,
            include: { course: true, courseDoctor: true },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.courseSale.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.courseSale.findUnique({
        where: { id },
        include: { course: true, courseDoctor: true },
    });
}

export async function create(data: Prisma.CourseSaleUncheckedCreateInput) {
    return prisma.courseSale.create({ data, include: { course: true, courseDoctor: true } });
}

export async function update(id: string, data: Prisma.CourseSaleUncheckedUpdateInput) {
    return prisma.courseSale.update({
        where: { id },
        data,
        include: { course: true, courseDoctor: true },
    });
}

export async function remove(id: string) {
    return prisma.courseSale.delete({ where: { id } });
}
