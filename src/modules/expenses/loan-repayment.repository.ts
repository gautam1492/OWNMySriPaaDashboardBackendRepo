import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: {
    where: Prisma.LoanRepaymentWhereInput;
    skip: number;
    take: number;
}) {
    const [items, total] = await prisma.$transaction([
        prisma.loanRepayment.findMany({
            where: params.where,
            include: { loan: true },
            orderBy: [{ year: "desc" }, { month: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.loanRepayment.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findById(id: string) {
    return prisma.loanRepayment.findUnique({ where: { id }, include: { loan: true } });
}

export async function create(data: Prisma.LoanRepaymentUncheckedCreateInput) {
    return prisma.loanRepayment.create({ data, include: { loan: true } });
}

export async function update(id: string, data: Prisma.LoanRepaymentUncheckedUpdateInput) {
    return prisma.loanRepayment.update({ where: { id }, data, include: { loan: true } });
}

export async function remove(id: string) {
    return prisma.loanRepayment.delete({ where: { id } });
}
