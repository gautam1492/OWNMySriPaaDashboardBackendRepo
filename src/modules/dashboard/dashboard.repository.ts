import { prisma } from "../../config/database.js";

type BranchWhere = { branchId?: string | { in: string[] } };

export async function loadSummaryCounts(params: {
    branchWhere: BranchWhere;
    dateWhere: { gte: Date; lt: Date };
}) {
    const { branchWhere, dateWhere } = params;
    const [visits, sales, serviceSales, feedback, branchRows, topProductRows, recentFeedback] =
        await Promise.all([
            prisma.patientVisit.aggregate({
                where: { ...branchWhere, date: dateWhere },
                _sum: { newPatients: true, followupPatients: true },
            }),
            prisma.sale.groupBy({
                by: ["entryType"],
                where: { ...branchWhere, date: dateWhere },
                orderBy: { entryType: "asc" },
                _sum: { totalAmount: true },
            }),
            prisma.serviceSale.aggregate({
                where: { ...branchWhere, date: dateWhere },
                _sum: { amount: true },
            }),
            prisma.feedbackEntry.findMany({
                where: { ...branchWhere, date: dateWhere },
                select: { frontdeskRating: true, posttreatmentRating: true },
            }),
            prisma.patientVisit.groupBy({
                by: ["branchId"],
                where: { ...branchWhere, date: dateWhere },
                orderBy: { branchId: "asc" },
                _sum: { newPatients: true, followupPatients: true },
            }),
            prisma.saleItem.groupBy({
                by: ["itemId", "itemNameSnapshot"],
                where: { sale: { ...branchWhere, date: dateWhere } },
                _sum: { unitSold: true, totalPrice: true },
                orderBy: { _sum: { totalPrice: "desc" } },
                take: 10,
            }),
            prisma.feedbackEntry.findMany({
                where: { ...branchWhere, date: dateWhere },
                include: { branch: true },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                take: 10,
            }),
        ]);

    const itemIds = [...new Set(topProductRows.map((row) => row.itemId))];
    const catalogItems = itemIds.length
        ? await prisma.item.findMany({
              where: { id: { in: itemIds } },
              select: { id: true, type: true },
          })
        : [];
    const itemTypes = new Map(catalogItems.map((item) => [item.id, item.type]));
    const topProducts = topProductRows.map((row) => ({
        ...row,
        itemType: itemTypes.get(row.itemId) ?? null,
    }));

    return {
        visits,
        sales,
        serviceRevenue: serviceSales._sum.amount,
        feedback,
        branchRows,
        topProducts,
        recentFeedback,
    };
}

export async function loadBranchVisitTrends(params: {
    start: Date;
    endExclusive: Date;
    branchWhere: BranchWhere;
}) {
    const { start, endExclusive, branchWhere } = params;
    const rows = await prisma.patientVisit.groupBy({
        by: ["branchId", "date"],
        where: { ...branchWhere, date: { gte: start, lt: endExclusive } },
        orderBy: [{ date: "asc" }, { branchId: "asc" }],
        _sum: { newPatients: true, followupPatients: true },
    });
    const branches = await prisma.branch.findMany({
        where: { id: { in: [...new Set(rows.map((row) => row.branchId))] }, isActive: true },
        select: { id: true, name: true },
    });
    const names = new Map(branches.map((branch) => [branch.id, branch.name]));
    return rows.map((row) => ({
        branchId: row.branchId,
        branchName: names.get(row.branchId) ?? "Unknown branch",
        date: row.date.toISOString().slice(0, 10),
        newPatients: row._sum.newPatients ?? 0,
        followupPatients: row._sum.followupPatients ?? 0,
        totalPatients: (row._sum.newPatients ?? 0) + (row._sum.followupPatients ?? 0),
    }));
}

export async function loadTrends(params: {
    start: Date;
    endExclusive: Date;
    branchWhere: BranchWhere;
}) {
    const { start, endExclusive, branchWhere } = params;
    const where = { ...branchWhere, date: { gte: start, lt: endExclusive } };
    const [sales, serviceSales, visits, feedback] = await Promise.all([
        prisma.sale.groupBy({ by: ["date", "entryType"], where, _sum: { totalAmount: true } }),
        prisma.serviceSale.groupBy({ by: ["date"], where, _sum: { amount: true } }),
        prisma.patientVisit.groupBy({
            by: ["date"],
            where,
            _sum: { newPatients: true, followupPatients: true },
        }),
        prisma.feedbackEntry.findMany({
            where,
            select: { date: true, frontdeskRating: true, posttreatmentRating: true },
        }),
    ]);
    return { sales, serviceSales, visits, feedback };
}
