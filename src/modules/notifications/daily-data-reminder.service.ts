import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { safeErrorMetadata } from "../../utils/safeError.js";
import { sendManagementNotification } from "../auth/auth-email.service.js";

const DELIVERY_LEASE_MS = 10 * 60 * 1000;

function businessClock(now: Date) {
    const values = new Intl.DateTimeFormat("en-CA", {
        timeZone: env.BUSINESS_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);
    const parts = Object.fromEntries(values.map(({ type, value }) => [type, value]));
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`,
    };
}

function dateBounds(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { gte: start, lt: end };
}

async function claimDelivery(userId: string, businessDate: string, now: Date) {
    await prisma.dailyDataReminderDelivery.upsert({
        where: { userId_businessDate: { userId, businessDate } },
        create: { userId, businessDate },
        update: {},
    });
    const claimed = await prisma.dailyDataReminderDelivery.updateMany({
        where: {
            userId,
            businessDate,
            sentAt: null,
            OR: [
                { claimedAt: null },
                { claimedAt: { lt: new Date(now.getTime() - DELIVERY_LEASE_MS) } },
            ],
        },
        data: { claimedAt: now, attempts: { increment: 1 } },
    });
    return claimed.count > 0;
}

export async function sendDailyDataReminders(now = new Date()) {
    const { date, time } = businessClock(now);
    if (time < env.DAILY_DATA_REMINDER_TIME) return;

    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    if (!branches.length) return;

    const dateWhere = dateBounds(date);
    const [visitRows, saleRows] = await Promise.all([
        prisma.patientVisit.groupBy({
            by: ["branchId"],
            where: { date: dateWhere, branchId: { in: branches.map(({ id }) => id) } },
        }),
        prisma.sale.groupBy({
            by: ["branchId"],
            where: { date: dateWhere, branchId: { in: branches.map(({ id }) => id) } },
        }),
    ]);
    const branchesWithVisits = new Set(visitRows.map(({ branchId }) => branchId));
    const branchesWithSales = new Set(saleRows.map(({ branchId }) => branchId));
    const incomplete = branches.flatMap((branch) => {
        const missing = [
            ...(!branchesWithVisits.has(branch.id) ? ["Patient Visits"] : []),
            ...(!branchesWithSales.has(branch.id) ? ["Medicine & OTC Sales"] : []),
        ];
        return missing.length ? [{ ...branch, missing }] : [];
    });
    if (!incomplete.length) return;

    const directors = await prisma.user.findMany({
        where: {
            isActive: true,
            isVerified: true,
            role: { name: "DIRECTOR" },
            branches: { some: { branchId: { in: incomplete.map(({ id }) => id) } } },
        },
        select: {
            id: true,
            email: true,
            branches: { select: { branchId: true } },
        },
    });
    const admins = await prisma.user.findMany({
        where: {
            isActive: true,
            isVerified: true,
            role: { name: "ADMIN" },
        },
        select: { id: true, email: true },
    });
    const adminIds = new Set(admins.map(({ id }) => id));
    const recipients = [
        ...admins.map((user) => ({ ...user, role: "ADMIN" as const })),
        ...directors
            .filter((user) => !adminIds.has(user.id))
            .map((user) => ({ ...user, role: "DIRECTOR" as const })),
    ];

    for (const recipient of recipients) {
        const assignedBranchIds = new Set(
            recipient.role === "ADMIN"
                ? branches.map(({ id }) => id)
                : recipient.branches.map(({ branchId }) => branchId),
        );
        const report = incomplete.filter(({ id }) => assignedBranchIds.has(id));
        if (!report.length) continue;

        try {
            if (!(await claimDelivery(recipient.id, date, now))) continue;
            const details = report.map(
                ({ name, missing }) => `${name}: missing ${missing.join(" and ")}`,
            );
            await sendManagementNotification(
                recipient.email,
                `Daily data entry reminder — ${date}`,
                `Daily entries are missing for ${report.length} ${report.length === 1 ? "branch" : "branches"}`,
                [`Business date: ${date}`, ...details],
            );
            await prisma.dailyDataReminderDelivery.updateMany({
                where: { userId: recipient.id, businessDate: date, claimedAt: now, sentAt: null },
                data: { sentAt: new Date(), claimedAt: null },
            });
        } catch (error) {
            logger.error(
                { ...safeErrorMetadata(error), recipientId: recipient.id, businessDate: date },
                "Daily data reminder delivery failed",
            );
            // Keep the claim until its lease expires to prevent rapid retry/email storms.
        }
    }
}
