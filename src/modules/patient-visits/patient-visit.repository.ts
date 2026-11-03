import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const include = { branch: true } as const;

export async function list(params: {
    where: Prisma.PatientVisitWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.patientVisit.findMany({
            where: params.where,
            include,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.patientVisit.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.patientVisit.findUnique({ where: { id } });
}

export async function create(data: Prisma.PatientVisitUncheckedCreateInput) {
    return prisma.patientVisit.create({ data, include });
}

export async function update(id: string, data: Prisma.PatientVisitUncheckedUpdateInput) {
    return prisma.patientVisit.update({ where: { id }, data, include });
}

export async function remove(id: string) {
    return prisma.patientVisit.delete({ where: { id } });
}
