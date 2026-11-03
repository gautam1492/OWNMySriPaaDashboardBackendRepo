import { isCrossBranchRole } from "../../constants/roles.js";
import { prisma } from "../../config/database.js";
import { branchFilter } from "../../utils/branchScope.js";
import type { AuthUser } from "../../types/common.types.js";

function canAccessModule(user: AuthUser, module: string) {
    return user.permissions.some((permission) => permission.startsWith(`${module}.`));
}

export async function summary(user: AuthUser, requestedBranchId?: string) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const periodLabel = new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(now);
    const scope = branchFilter(user, requestedBranchId);
    const branchWhere =
        "branchId" in scope && scope.branchId !== undefined ? { branchId: scope.branchId } : {};
    const where = { ...branchWhere, createdAt: { gte: start, lt: end } };
    const selectedBranchName = requestedBranchId
        ? ((
              await prisma.branch.findUnique({
                  where: { id: requestedBranchId },
                  select: { name: true },
              })
          )?.name ?? null)
        : null;

    if (isCrossBranchRole(user.role)) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [pendingInvitations, inactiveUsers, recentActivity] = await Promise.all([
            prisma.userInvitation.count({ where: { status: "PENDING", expiresAt: { gt: now } } }),
            prisma.user.count({ where: { isActive: false } }),
            prisma.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
        ]);
        return {
            periodLabel,
            assignedBranchCount: null,
            selectedBranchName,
            counts: [],
            attention: [
                {
                    key: "invitations",
                    label: "Pending invitations",
                    value: pendingInvitations,
                    href: "/admin/users?tab=invitations",
                    detail: "Waiting for invitees",
                },
                {
                    key: "inactiveUsers",
                    label: "Inactive accounts",
                    value: inactiveUsers,
                    href: "/admin/users",
                    detail: "Review account access",
                },
                {
                    key: "activity",
                    label: "Recent activity",
                    value: recentActivity,
                    href: "/admin/audit",
                    detail: "Events in the last 7 days",
                },
            ],
        };
    }

    const [sales, serviceSales, visits, feedback, branchExpenses] = await Promise.all([
        canAccessModule(user, "sales") ? prisma.sale.count({ where }) : Promise.resolve(null),
        canAccessModule(user, "serviceSales")
            ? prisma.serviceSale.count({ where })
            : Promise.resolve(null),
        canAccessModule(user, "visits")
            ? prisma.patientVisit.count({ where })
            : Promise.resolve(null),
        canAccessModule(user, "feedback")
            ? prisma.feedbackEntry.count({ where })
            : Promise.resolve(null),
        canAccessModule(user, "branchExpenses")
            ? Promise.all([
                  prisma.branchSalary.count({ where }),
                  prisma.branchRent.count({ where }),
                  prisma.branchWaterBill.count({ where }),
                  prisma.branchPowerBill.count({ where }),
                  prisma.branchFoodGroceries.count({ where }),
                  prisma.branchGovernmentFee.count({ where }),
                  prisma.branchInvestmentPurchase.count({ where }),
                  prisma.branchMiscellaneousExpense.count({ where }),
              ]).then((values) => values.reduce((total, value) => total + value, 0))
            : Promise.resolve(null),
    ]);

    const counts = [
        { key: "sales", label: "Medicine & OTC sales", value: sales, href: "/sales" },
        {
            key: "serviceSales",
            label: "Service sales",
            value: serviceSales,
            href: "/service-sales",
        },
        { key: "visits", label: "Patient visit logs", value: visits, href: "/patient-visits" },
        { key: "feedback", label: "Patient feedback", value: feedback, href: "/feedback" },
        {
            key: "branchExpenses",
            label: "Branch expense entries",
            value: branchExpenses,
            href: "/finance/branch-expenses",
        },
    ].filter((item) => item.value !== null);

    return {
        periodLabel,
        assignedBranchCount: user.branchIds.length,
        selectedBranchName,
        counts,
        attention: [],
    };
}
