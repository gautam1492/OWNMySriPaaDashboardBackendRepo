import { EntryType } from "@prisma/client";
import { dateRange, endExclusive } from "../../utils/dates.js";
import { branchFilter } from "../../utils/branchScope.js";
import * as branchRepository from "../branches/branch.repository.js";
import * as dashboardRepository from "./dashboard.repository.js";
import type { AuthUser, PeriodQuery } from "./dashboard.types.js";

export async function summary(user: AuthUser, query: PeriodQuery) {
    const range = dateRange(query.period, query.startDate, query.endDate);
    const branch = branchFilter(user, query.branchId);
    const branchWhere =
        "branchId" in branch && branch.branchId !== undefined ? { branchId: branch.branchId } : {};
    const dateWhere = { gte: range.start, lt: endExclusive(range.end) };
    const data = await dashboardRepository.loadSummaryCounts({ branchWhere, dateWhere });

    const feedbackRatingTotals = data.feedback.reduce(
        (totals, entry) => ({
            frontdesk: totals.frontdesk + entry.frontdeskRating,
            posttreatment: totals.posttreatment + entry.posttreatmentRating,
        }),
        { frontdesk: 0, posttreatment: 0 },
    );
    const feedbackCount = data.feedback.length;
    const frontdeskAverage = feedbackCount ? feedbackRatingTotals.frontdesk / feedbackCount : 0;
    const posttreatmentAverage = feedbackCount
        ? feedbackRatingTotals.posttreatment / feedbackCount
        : 0;

    const allBranches = await branchRepository.findActiveMany();
    const branchMap = new Map(allBranches.map((item) => [item.id, item]));
    const comparison = data.branchRows
        .filter((row) => branchMap.has(row.branchId))
        .map((row) => ({
            branch: branchMap.get(row.branchId)!.name,
            patientVisits: (row._sum?.newPatients ?? 0) + (row._sum?.followupPatients ?? 0),
        }));

    const revenueBreakdown = [
        ...Object.values(EntryType).map((entryType) => ({
            entryType,
            value: Number(
                data.sales.find((row) => row.entryType === entryType)?._sum?.totalAmount ?? 0,
            ),
        })),
        { entryType: "SERVICE" as const, value: Number(data.serviceRevenue ?? 0) },
    ];
    const newPatients = data.visits._sum.newPatients ?? 0;
    const followupPatients = data.visits._sum.followupPatients ?? 0;

    return {
        range: {
            startDate: range.start.toISOString().slice(0, 10),
            endDate: range.end.toISOString().slice(0, 10),
        },
        kpis: {
            patientVisits: {
                newPatients,
                followupPatients,
                totalPatients: newPatients + followupPatients,
            },
            revenue: {
                doctorPrescribedRevenue:
                    revenueBreakdown.find(
                        (row) => row.entryType === EntryType.DOCTOR_PRESCRIBED_MEDICINE,
                    )?.value ?? 0,
                otcRevenue:
                    revenueBreakdown.find((row) => row.entryType === EntryType.OTC)?.value ?? 0,
                serviceRevenue:
                    revenueBreakdown.find((row) => row.entryType === "SERVICE")?.value ?? 0,
                totalRevenue: revenueBreakdown.reduce((sum, row) => sum + row.value, 0),
            },
            feedback: {
                frontdeskAverage,
                posttreatmentAverage,
                averageRating: feedbackCount ? (frontdeskAverage + posttreatmentAverage) / 2 : 0,
                totalScored: feedbackCount,
            },
        },
        charts: {
            revenueSplit: revenueBreakdown.map((row) => ({
                label:
                    row.entryType === EntryType.DOCTOR_PRESCRIBED_MEDICINE
                        ? "Doctor Prescribed Medicine"
                        : row.entryType === EntryType.OTC
                          ? "OTC"
                          : "Services",
                value: row.value,
            })),
            patientVisits: [
                { label: "New", value: newPatients },
                { label: "Follow-up", value: followupPatients },
            ],
            feedback: [
                { label: "Front-desk", value: frontdeskAverage },
                { label: "Post-treatment", value: posttreatmentAverage },
            ],
            branchComparison: comparison,
        },
        supporting: {
            topProducts: data.topProducts.map((row) => ({
                name: row.itemNameSnapshot,
                type: row.itemType,
                units: row._sum?.unitSold ?? 0,
                revenue: Number(row._sum?.totalPrice ?? 0),
            })),
            recentFeedback: data.recentFeedback.map((row) => ({
                date: row.date.toISOString().slice(0, 10),
                branch: row.branch.name,
                doctor: row.doctor,
                service: row.service,
                frontdeskRating: row.frontdeskRating,
                posttreatmentRating: row.posttreatmentRating,
                comments: row.comments,
            })),
        },
    };
}

type TrendAccumulator = {
    date: Date;
    revenue: number;
    newPatients: number;
    followupPatients: number;
    frontdeskRatingTotal: number;
    posttreatmentRatingTotal: number;
    ratingCount: number;
};

export async function trends(user: AuthUser, query: PeriodQuery) {
    const range = dateRange(query.period, query.startDate, query.endDate);
    const branch = branchFilter(user, query.branchId);
    const branchWhere =
        "branchId" in branch && branch.branchId !== undefined ? { branchId: branch.branchId } : {};
    const data = await dashboardRepository.loadTrends({
        start: range.start,
        endExclusive: endExclusive(range.end),
        branchWhere,
    });

    const byDate = new Map<string, TrendAccumulator>();
    const rowFor = (date: Date) => {
        const key = date.toISOString().slice(0, 10);
        let row = byDate.get(key);
        if (!row) {
            row = {
                date,
                revenue: 0,
                newPatients: 0,
                followupPatients: 0,
                frontdeskRatingTotal: 0,
                posttreatmentRatingTotal: 0,
                ratingCount: 0,
            };
            byDate.set(key, row);
        }
        return row;
    };

    for (const row of data.sales) {
        rowFor(row.date).revenue += Number(row._sum.totalAmount ?? 0);
    }
    for (const row of data.serviceSales) {
        rowFor(row.date).revenue += Number(row._sum.amount ?? 0);
    }
    for (const row of data.visits) {
        const target = rowFor(row.date);
        target.newPatients += row._sum.newPatients ?? 0;
        target.followupPatients += row._sum.followupPatients ?? 0;
    }
    for (const entry of data.feedback) {
        const target = rowFor(entry.date);
        target.frontdeskRatingTotal += entry.frontdeskRating;
        target.posttreatmentRatingTotal += entry.posttreatmentRating;
        target.ratingCount += 1;
    }

    return [...byDate.values()]
        .sort((left, right) => left.date.getTime() - right.date.getTime())
        .map((row) => ({
            date: row.date.toISOString().slice(0, 10),
            revenue: row.revenue,
            newPatients: row.newPatients,
            followupPatients: row.followupPatients,
            totalPatients: row.newPatients + row.followupPatients,
            frontdeskRatingTotal: row.frontdeskRatingTotal,
            posttreatmentRatingTotal: row.posttreatmentRatingTotal,
            ratingCount: row.ratingCount,
        }));
}

export async function branchVisitTrends(user: AuthUser, query: PeriodQuery) {
    const range = dateRange(query.period, query.startDate, query.endDate);
    const branch = branchFilter(user, query.branchId);
    const branchWhere =
        "branchId" in branch && branch.branchId !== undefined ? { branchId: branch.branchId } : {};
    return dashboardRepository.loadBranchVisitTrends({
        start: range.start,
        endExclusive: endExclusive(range.end),
        branchWhere,
    });
}
