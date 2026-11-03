import { describe, expect, it, beforeEach, vi } from "vitest";
import { EntryType, Prisma } from "@prisma/client";
import * as dashboardService from "../../src/modules/dashboard/dashboard.service.js";
import type { AuthUser, PeriodQuery } from "../../src/modules/dashboard/dashboard.types.js";

vi.mock("../../src/modules/dashboard/dashboard.repository.js", () => ({
    loadSummaryCounts: vi.fn(),
    loadTrends: vi.fn(),
}));
vi.mock("../../src/modules/branches/branch.repository.js", () => ({
    findActiveByCodes: vi.fn(),
}));

import * as dashboardRepository from "../../src/modules/dashboard/dashboard.repository.js";
import * as branchRepository from "../../src/modules/branches/branch.repository.js";

const user: AuthUser = {
    id: "u1",
    name: "Test User",
    email: "test@example.com",
    roleId: "r1",
    branchIds: [],
    permissions: [],
    role: "ADMIN" as const,
};

const query: PeriodQuery = {};

describe("dashboard service", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(branchRepository.findActiveByCodes).mockResolvedValue([] as never);
    });

    it("summary computes KPIs from repository data", async () => {
        vi.mocked(dashboardRepository.loadSummaryCounts).mockResolvedValue({
            visits: { _sum: { newPatients: 100, followupPatients: 50 } } as any,
            sales: [
                {
                    entryType: EntryType.OTC,
                    _sum: { totalAmount: 3000 as unknown as Prisma.Decimal },
                },
                {
                    entryType: EntryType.DOCTOR_PRESCRIBED_MEDICINE,
                    _sum: { totalAmount: 7000 as unknown as Prisma.Decimal },
                },
            ] as any,
            serviceRevenue: 5000 as unknown as Prisma.Decimal,
            feedback: [
                { frontdeskRating: 5, posttreatmentRating: 5 },
                { frontdeskRating: 2, posttreatmentRating: 2 },
                { frontdeskRating: 3, posttreatmentRating: 4 },
            ] as any,
            branchRows: [],
            topProducts: [],
            recentFeedback: [],
        } as any);

        const result = await dashboardService.summary(user, query);

        expect(result.kpis.patientVisits).toEqual({
            newPatients: 100,
            followupPatients: 50,
            totalPatients: 150,
        });
        expect(result.kpis.revenue).toEqual({
            doctorPrescribedRevenue: 7000,
            otcRevenue: 3000,
            serviceRevenue: 5000,
            totalRevenue: 15000,
        });
        expect(result.kpis.feedback).toEqual({
            frontdeskAverage: 10 / 3,
            posttreatmentAverage: 11 / 3,
            averageRating: 3.5,
            totalScored: 3,
        });
    });

    it("trends maps repository rows to response format", async () => {
        vi.mocked(dashboardRepository.loadTrends).mockResolvedValue({
            sales: [
                {
                    date: new Date("2026-09-01"),
                    entryType: EntryType.OTC,
                    _sum: { totalAmount: 1000 as unknown as Prisma.Decimal },
                },
            ],
            serviceSales: [
                {
                    date: new Date("2026-09-01"),
                    _sum: { amount: 500 as unknown as Prisma.Decimal },
                },
            ],
            visits: [
                { date: new Date("2026-09-01"), _sum: { newPatients: 10, followupPatients: 5 } },
            ],
            feedback: [
                { date: new Date("2026-09-01"), frontdeskRating: 5, posttreatmentRating: 5 },
                { date: new Date("2026-09-01"), frontdeskRating: 4, posttreatmentRating: 4 },
                { date: new Date("2026-09-01"), frontdeskRating: 5, posttreatmentRating: 4 },
                { date: new Date("2026-09-01"), frontdeskRating: 3, posttreatmentRating: 4 },
                { date: new Date("2026-09-01"), frontdeskRating: 3, posttreatmentRating: 3 },
            ],
        } as any);

        const result = await dashboardService.trends(user, { ...query, period: "daily" });

        expect(result).toEqual([
            {
                date: "2026-09-01",
                revenue: 1500,
                newPatients: 10,
                followupPatients: 5,
                totalPatients: 15,
                frontdeskRatingTotal: 20,
                posttreatmentRatingTotal: 20,
                ratingCount: 5,
            },
        ]);
    });

    it("summary handles empty repository data", async () => {
        vi.mocked(dashboardRepository.loadSummaryCounts).mockResolvedValue({
            visits: { _sum: { newPatients: null, followupPatients: null } },
            sales: [],
            serviceRevenue: null,
            feedback: [],
            branchRows: [],
            topProducts: [],
            recentFeedback: [],
        } as any);

        const result = await dashboardService.summary(user, query);

        expect(result.kpis.patientVisits).toEqual({
            newPatients: 0,
            followupPatients: 0,
            totalPatients: 0,
        });
        expect(result.kpis.revenue.totalRevenue).toBe(0);
        expect(result.kpis.feedback.totalScored).toBe(0);
    });
});
