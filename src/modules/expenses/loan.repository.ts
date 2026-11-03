import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function list(params: { where: Prisma.LoanWhereInput; skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
        prisma.loan.findMany({
            where: params.where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        prisma.loan.count({ where: params.where }),
    ]);
    const repayments = items.length
        ? await prisma.loanRepayment.groupBy({
              by: ["loanId"],
              where: { loanId: { in: items.map((loan) => loan.id) } },
              _sum: { repaymentAmount: true },
          })
        : [];
    const repaidByLoan = new Map(
        repayments.map((repayment) => [
            repayment.loanId,
            repayment._sum.repaymentAmount?.toNumber() ?? 0,
        ]),
    );
    return {
        items: items.map((loan) => {
            const originalAmount = loan.originalAmount.toNumber();
            const repaidAmount = repaidByLoan.get(loan.id) ?? 0;
            return {
                ...loan,
                originalAmount,
                outstandingAmount: Math.max(0, originalAmount - repaidAmount),
            };
        }),
        total,
    };
}

export async function findById(id: string) {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) return null;
    return withOutstandingAmount(loan);
}

async function withOutstandingAmount<T extends { id: string; originalAmount: Prisma.Decimal }>(
    loan: T,
) {
    const repayments = await prisma.loanRepayment.aggregate({
        where: { loanId: loan.id },
        _sum: { repaymentAmount: true },
    });
    const originalAmount = loan.originalAmount.toNumber();
    const repaidAmount = repayments._sum.repaymentAmount?.toNumber() ?? 0;
    return {
        ...loan,
        originalAmount,
        outstandingAmount: Math.max(0, originalAmount - repaidAmount),
    };
}

export async function create(data: Prisma.LoanUncheckedCreateInput) {
    const loan = await prisma.loan.create({ data });
    return withOutstandingAmount(loan);
}

export async function update(id: string, data: Prisma.LoanUncheckedUpdateInput) {
    const loan = await prisma.loan.update({ where: { id }, data });
    return withOutstandingAmount(loan);
}

export async function remove(id: string) {
    return prisma.loan.delete({ where: { id } });
}
