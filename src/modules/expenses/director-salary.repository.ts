import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const include = {
    directorUser: { select: { id: true, name: true, email: true } },
    director: true,
} as const;

export async function list(params: {
    where: Prisma.DirectorSalaryWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.directorSalary.findMany({
            where: params.where,
            include,
            orderBy: [{ year: "desc" }, { month: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.directorSalary.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.directorSalary.findUnique({ where: { id }, include });
}

export async function create(data: Prisma.DirectorSalaryUncheckedCreateInput) {
    return prisma.directorSalary.create({ data, include });
}

export async function update(id: string, data: Prisma.DirectorSalaryUncheckedUpdateInput) {
    return prisma.directorSalary.update({ where: { id }, data, include });
}

export async function remove(id: string) {
    return prisma.directorSalary.delete({ where: { id } });
}
