import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const include = { branch: true } as const;

export async function list(params: {
    where: Prisma.FeedbackEntryWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.feedbackEntry.findMany({
            where: params.where,
            include,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.feedbackEntry.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.feedbackEntry.findUnique({ where: { id } });
}

export async function create(data: Prisma.FeedbackEntryUncheckedCreateInput) {
    return prisma.feedbackEntry.create({ data, include });
}

export async function update(id: string, data: Prisma.FeedbackEntryUncheckedUpdateInput) {
    return prisma.feedbackEntry.update({ where: { id }, data, include });
}

export async function remove(id: string) {
    return prisma.feedbackEntry.delete({ where: { id } });
}
