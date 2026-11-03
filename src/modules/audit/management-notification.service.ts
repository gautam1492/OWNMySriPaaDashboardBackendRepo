import { prisma } from "../../config/database.js";
import { ROLES } from "../../constants/roles.js";
import { logger } from "../../config/logger.js";
import { safeErrorMetadata } from "../../utils/safeError.js";
import { sendManagementNotification } from "../auth/auth-email.service.js";
import type { AuditInput } from "./audit.types.js";

function stringValue(value: unknown) {
    return typeof value === "string" ? value : undefined;
}

function titleCase(value: string) {
    return value
        .toLowerCase()
        .split(/[_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function eventForAudit(input: AuditInput) {
    const notificationActions = new Set([
        "USER_INVITATION_ACCEPTED",
        "USER_ROLE_CHANGED",
        "USER_ACTIVATED",
        "USER_DEACTIVATED",
        "PERMISSIONS_GRANTED",
        "PERMISSION_REVOKED",
    ]);
    if (!notificationActions.has(input.action) && !input.action.endsWith("_DELETED")) return null;

    const metadata = input.metadata ?? {};
    const actor = input.userId
        ? await prisma.user.findUnique({
              where: { id: input.userId },
              select: { name: true, email: true },
          })
        : null;
    const performedBy = actor ? `${actor.name} (${actor.email})` : "System";

    if (input.action === "USER_INVITATION_ACCEPTED" && input.resourceId) {
        const invitation = await prisma.userInvitation.findUnique({
            where: { id: input.resourceId },
            include: {
                role: { select: { name: true } },
                invitedBy: { select: { name: true, email: true } },
                branches: { include: { branch: { select: { name: true } } } },
            },
        });
        if (invitation) {
            return {
                heading: "A new user account was activated",
                details: [
                    `User: ${invitation.invitedName} (${invitation.email})`,
                    `Role: ${titleCase(invitation.role.name)}`,
                    `Branches: ${invitation.branches.map(({ branch }) => branch.name).join(", ") || "All clinic branches"}`,
                    `Invited by: ${invitation.invitedBy.name} (${invitation.invitedBy.email})`,
                ],
            };
        }
    }

    if (input.action === "USER_ROLE_CHANGED") {
        return {
            heading: "A user role was changed",
            details: [
                `Account: ${stringValue(metadata.targetName) ?? input.resourceId ?? "Unknown"}`,
                `New role: ${titleCase(stringValue(metadata.roleName) ?? "Unknown")}`,
                `Changed by: ${performedBy}`,
            ],
        };
    }

    if (input.action === "USER_ACTIVATED" || input.action === "USER_DEACTIVATED") {
        return {
            heading:
                input.action === "USER_ACTIVATED"
                    ? "A user account was activated"
                    : "A user account was deactivated",
            details: [
                `Account: ${stringValue(metadata.targetName) ?? input.resourceId ?? "Unknown"}`,
                `Changed by: ${performedBy}`,
            ],
        };
    }

    if (input.action === "PERMISSIONS_GRANTED" || input.action === "PERMISSION_REVOKED") {
        const permissions = metadata.permissionKeys;
        const permissionList = Array.isArray(permissions)
            ? permissions.filter((value): value is string => typeof value === "string").join(", ")
            : (stringValue(metadata.permissionKey) ?? "Not available");
        return {
            heading:
                input.action === "PERMISSIONS_GRANTED"
                    ? "User permissions were added"
                    : "A user permission was removed",
            details: [
                `Account: ${stringValue(metadata.targetName) ?? input.resourceId ?? "Unknown"}`,
                `Permissions: ${permissionList}`,
                `Changed by: ${performedBy}`,
            ],
        };
    }

    if (input.action.endsWith("_DELETED")) {
        const context = [
            "name",
            "targetName",
            "targetEmail",
            "entryType",
            "expenseKind",
            "date",
            "billingDate",
            "paymentDate",
            "branchName",
            "code",
            "companyName",
            "personName",
            "directorName",
            "loanName",
            "role",
            "itemName",
            "itemType",
            "paymentMethod",
            "month",
            "year",
            "expenseMonth",
            "expenseYear",
            "invoiceId",
            "voucherId",
            "billId",
            "totalAmount",
            "amount",
            "amountPaid",
            "salary",
            "rentAmount",
            "netAmount",
            "originalAmount",
            "outstandingAmount",
            "percentage",
            "repaymentAmount",
        ]
            .map((key) => {
                const rawValue = metadata[key];
                const value =
                    typeof rawValue === "string" || typeof rawValue === "number"
                        ? String(rawValue)
                        : undefined;
                return value ? `${titleCase(key)}: ${value}` : undefined;
            })
            .filter((value): value is string => Boolean(value));
        return {
            heading: "A company data record was deleted",
            details: [
                `Record type: ${titleCase(input.resourceType)}`,
                `Record reference: ${input.resourceId ?? "Not available"}`,
                ...context,
                `Deleted by: ${performedBy}`,
            ],
        };
    }

    return null;
}

export async function notifyManagementForAudit(input: AuditInput) {
    const event = await eventForAudit(input);
    if (!event) return;
    const metadata = input.metadata ?? {};
    let branchIds = [
        ...(Array.isArray(metadata.branchIds)
            ? metadata.branchIds.filter((value): value is string => typeof value === "string")
            : []),
        ...(stringValue(metadata.branchId) ? [stringValue(metadata.branchId)!] : []),
    ];
    if (input.action === "USER_INVITATION_ACCEPTED" && input.resourceId) {
        const invitation = await prisma.userInvitation.findUnique({
            where: { id: input.resourceId },
            select: { branches: { select: { branchId: true } } },
        });
        branchIds = invitation?.branches.map(({ branchId }) => branchId) ?? [];
    } else if (input.resourceType === "USER" && input.resourceId && branchIds.length === 0) {
        const target = await prisma.user.findUnique({
            where: { id: input.resourceId },
            select: { branches: { select: { branchId: true } } },
        });
        branchIds = target?.branches.map(({ branchId }) => branchId) ?? [];
    }
    branchIds = [...new Set(branchIds)];
    const recipients = await prisma.user.findMany({
        where: {
            isActive: true,
            isVerified: true,
            OR: [
                { role: { name: ROLES.ADMIN } },
                ...(branchIds.length
                    ? [
                          {
                              role: { name: ROLES.DIRECTOR },
                              branches: { some: { branchId: { in: branchIds } } },
                          },
                      ]
                    : []),
            ],
        },
        select: { email: true },
    });
    const uniqueEmails = [...new Set(recipients.map(({ email }) => email.toLowerCase()))];
    const subject = `SriPAA notification: ${event.heading}`;
    await Promise.all(
        uniqueEmails.map(async (email) => {
            try {
                await sendManagementNotification(email, subject, event.heading, event.details);
            } catch (error) {
                logger.error(
                    { ...safeErrorMetadata(error), action: input.action },
                    "Management notification email delivery failed",
                );
            }
        }),
    );
}
