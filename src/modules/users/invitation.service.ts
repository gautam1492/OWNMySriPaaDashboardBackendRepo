import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, UserInvitationStatus } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { canManageUserWithRole, isCrossBranchRole } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashToken } from "../auth/auth.service.js";
import { writeAudit } from "../audit/audit.service.js";
import { safeErrorMetadata } from "../../utils/safeError.js";
import { EmailDeliveryError } from "../../config/email.js";
import { sendInvitationExpiredNotice, sendUserInvitation } from "./invitation-email.service.js";
import type {
    AcceptInvitationInput,
    CreateInvitationInput,
    InvitationListQuery,
} from "./invitation.validator.js";

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRY_NOTICE_LEASE_MS = 10 * 60 * 1000;
const invitationInclude = {
    role: { select: { id: true, name: true } },
    invitedBy: { select: { id: true, name: true, email: true } },
    branches: {
        include: { branch: { select: { id: true, name: true, code: true, isActive: true } } },
    },
} as const;

type InvitationWithRelations = Prisma.UserInvitationGetPayload<{
    include: typeof invitationInclude;
}>;

function safeEmailFailureReason(error: unknown) {
    if (error instanceof EmailDeliveryError) {
        if (error.category === "configuration") return error.message;
        if (error.statusCode === 401 || error.statusCode === 403) {
            return "Brevo rejected the API credentials or sender authorization. Check the Brevo API key and verified sender.";
        }
        if (error.statusCode === 400) {
            return "Brevo rejected the email details. Check the recipient and verified sender configuration.";
        }
        return error.message;
    }
    return "Invitation email delivery failed. Check the backend mail configuration and logs.";
}

function invitationDto(invitation: InvitationWithRelations) {
    return {
        id: invitation.id,
        invitedName: invitation.invitedName,
        email: invitation.email,
        status: invitation.status,
        role: invitation.role,
        branches: invitation.branches.map(({ branch }) => ({
            id: branch.id,
            name: branch.name,
            code: branch.code,
        })),
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        lastSentAt: invitation.lastSentAt,
        acceptedAt: invitation.acceptedAt,
        revokedAt: invitation.revokedAt,
        createdAt: invitation.createdAt,
        emailDeliveryFailed: Boolean(invitation.lastEmailError),
        emailDeliveryError: invitation.lastEmailError,
    };
}

function invitationEmailDetails(invitation: InvitationWithRelations, token?: string) {
    return {
        invitedName: invitation.invitedName,
        email: invitation.email,
        roleName: invitation.role.name,
        inviterName: invitation.invitedBy.name,
        inviterEmail: invitation.invitedBy.email,
        branchNames: invitation.branches.map(({ branch }) => branch.name),
        expiresAt: invitation.expiresAt,
        ...(token ? { token } : {}),
    };
}

async function requireActor(actorId: string) {
    const actor = await prisma.user.findUnique({
        where: { id: actorId },
        include: { role: true, branches: { select: { branchId: true } } },
    });
    if (!actor || !actor.isActive || !actor.isVerified) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your account cannot manage invitations.");
    }
    return actor;
}

function assertCanManageRole(actorRole: string, targetRole: string) {
    if (!canManageUserWithRole(actorRole as never, targetRole as never)) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, "You cannot invite users with this role.");
    }
}

async function deliverInvitation(invitationId: string, token: string) {
    const invitation = await prisma.userInvitation.findUnique({
        where: { id: invitationId },
        include: invitationInclude,
    });
    if (!invitation) return false;
    try {
        const messageId = await sendUserInvitation(invitationEmailDetails(invitation, token));
        logger.info({ invitationId, messageId }, "Invitation email accepted by Brevo");
    } catch (error) {
        const failureReason = safeEmailFailureReason(error);
        logger.error({ invitationId, failureReason }, "Invitation email delivery failed");
        try {
            await prisma.userInvitation.update({
                where: { id: invitation.id },
                data: { lastEmailError: failureReason },
            });
        } catch (statusError) {
            logger.error(
                { ...safeErrorMetadata(statusError), invitationId },
                "Could not save invitation email failure status",
            );
        }
        return false;
    }
    try {
        await prisma.userInvitation.update({
            where: { id: invitation.id },
            data: { lastSentAt: new Date(), lastEmailError: null },
        });
    } catch (error) {
        // Brevo accepted the message; do not report delivery failure just because
        // recording the sent timestamp failed afterward.
        logger.error(
            { ...safeErrorMetadata(error), invitationId },
            "Invitation sent but status update failed",
        );
    }
    return true;
}

export async function create(
    actorId: string,
    input: CreateInvitationInput,
    meta?: { ip?: string; userAgent?: string },
) {
    const actor = await requireActor(actorId);
    const email = input.email.trim().toLowerCase();
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) throw new ApiError(HTTP_STATUS.NOT_FOUND, "The selected role was not found.");
    assertCanManageRole(actor.role.name, role.name);

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "A user account already exists for this email.");
    }
    const pendingInvitation = await prisma.userInvitation.findFirst({
        where: { email, status: UserInvitationStatus.PENDING, expiresAt: { gt: new Date() } },
        select: { id: true },
    });
    if (pendingInvitation) {
        throw new ApiError(
            HTTP_STATUS.CONFLICT,
            "An active invitation already exists for this email.",
        );
    }

    const branchIds = [...new Set(input.branchIds)];
    if (isCrossBranchRole(role.name) && branchIds.length) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Cross-branch roles do not use explicit branch assignments.",
        );
    }
    if (!isCrossBranchRole(role.name) && !branchIds.length) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "At least one branch must be assigned to this role.",
        );
    }
    if (actor.role.name === "DIRECTOR") {
        const actorBranchIds = new Set(actor.branches.map(({ branchId }) => branchId));
        if (!branchIds.length || branchIds.some((branchId) => !actorBranchIds.has(branchId))) {
            throw new ApiError(
                HTTP_STATUS.FORBIDDEN,
                "Directors can assign users only to their own assigned branches.",
            );
        }
    }
    if (branchIds.length) {
        const activeBranchCount = await prisma.branch.count({
            where: { id: { in: branchIds }, isActive: true },
        });
        if (activeBranchCount !== branchIds.length) {
            throw new ApiError(
                HTTP_STATUS.UNPROCESSABLE,
                "One or more selected branches are unavailable.",
            );
        }
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const invitation = await prisma.userInvitation.create({
        data: {
            invitedName: input.name,
            email,
            roleId: role.id,
            invitedById: actor.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS),
            branches: branchIds.length
                ? { create: branchIds.map((branchId) => ({ branchId })) }
                : undefined,
        },
        include: invitationInclude,
    });
    const emailSent = await deliverInvitation(invitation.id, token);
    await writeAudit({
        userId: actor.id,
        action: "USER_INVITATION_SENT",
        resourceType: "USER_INVITATION",
        resourceId: invitation.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: {
            email,
            name: invitation.invitedName,
            role: role.name,
            branchNames: invitation.branches.map(({ branch }) => branch.name),
            emailSent,
        },
    });
    const latest = await prisma.userInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
        include: invitationInclude,
    });
    return { invitation: invitationDto(latest), emailSent };
}

export async function list(actorId: string, query: InvitationListQuery) {
    const actor = await requireActor(actorId);
    const actorBranchIds = actor.branches.map(({ branchId }) => branchId);
    const filters: Prisma.UserInvitationWhereInput[] = [];
    if (actor.role.name === "DIRECTOR") {
        filters.push({
            OR: [
                { invitedById: actor.id },
                { branches: { some: { branchId: { in: actorBranchIds } } } },
            ],
        });
    } else if (actor.role.name !== "SUPER_ADMIN" && actor.role.name !== "ADMIN") {
        filters.push({ invitedById: actor.id });
    }
    if (query.status) filters.push({ status: query.status });
    if (query.search) {
        filters.push({
            OR: [
                { invitedName: { contains: query.search } },
                { email: { contains: query.search } },
            ],
        });
    }
    const where: Prisma.UserInvitationWhereInput = filters.length ? { AND: filters } : {};
    const [items, total] = await prisma.$transaction([
        prisma.userInvitation.findMany({
            where,
            include: invitationInclude,
            orderBy: { createdAt: "desc" },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
        }),
        prisma.userInvitation.count({ where }),
    ]);
    return { items: items.map(invitationDto), total };
}

async function findManageableInvitation(actorId: string, invitationId: string) {
    const actor = await requireActor(actorId);
    const invitation = await prisma.userInvitation.findUnique({
        where: { id: invitationId },
        include: invitationInclude,
    });
    if (!invitation) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Invitation not found.");
    if (
        invitation.invitedById !== actor.id &&
        actor.role.name !== "SUPER_ADMIN" &&
        !canManageUserWithRole(actor.role.name, invitation.role.name)
    ) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, "You cannot manage this invitation.");
    }
    if (actor.role.name === "DIRECTOR") {
        const allowed = new Set(actor.branches.map(({ branchId }) => branchId));
        if (
            invitation.branches.length === 0 ||
            invitation.branches.some(({ branchId }) => !allowed.has(branchId))
        ) {
            throw new ApiError(
                HTTP_STATUS.FORBIDDEN,
                "This invitation is outside your branch scope.",
            );
        }
    }
    return { actor, invitation };
}

export async function resend(
    actorId: string,
    invitationId: string,
    meta?: { ip?: string; userAgent?: string },
) {
    const { actor, invitation } = await findManageableInvitation(actorId, invitationId);
    logger.info({ invitationId: invitation.id }, "Invitation resend request authorized");
    if (
        invitation.status === UserInvitationStatus.ACCEPTED ||
        invitation.status === UserInvitationStatus.REVOKED
    ) {
        throw new ApiError(
            HTTP_STATUS.CONFLICT,
            "Accepted or revoked invitations cannot be resent.",
        );
    }
    if (invitation.branches.some(({ branch }) => !branch.isActive)) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "One or more assigned branches are no longer active. Update the invitation branches first.",
        );
    }
    if (
        await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } })
    ) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "A user account already exists for this email.");
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const now = new Date();
    const updatedCount = await prisma.userInvitation.updateMany({
        where: {
            id: invitation.id,
            status: { in: [UserInvitationStatus.PENDING, UserInvitationStatus.EXPIRED] },
        },
        data: {
            status: UserInvitationStatus.PENDING,
            tokenHash: hashToken(token),
            expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
            lastSentAt: null,
            lastEmailError: null,
            expiryEmailClaimedAt: null,
            expiryEmailSentAt: null,
            expiryEmailAttempts: 0,
            revokedAt: null,
            acceptedAt: null,
        },
    });
    if (!updatedCount.count)
        throw new ApiError(HTTP_STATUS.CONFLICT, "Invitation changed. Refresh and try again.");
    logger.info(
        {
            invitationId: invitation.id,
            expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
        },
        "Invitation link rotated for resend",
    );
    const emailSent = await deliverInvitation(invitation.id, token);
    logger.info({ invitationId: invitation.id, emailSent }, "Invitation resend attempt completed");
    await writeAudit({
        userId: actor.id,
        action: "USER_INVITATION_RESENT",
        resourceType: "USER_INVITATION",
        resourceId: invitation.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { email: invitation.email, emailSent },
    });
    const latest = await prisma.userInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
        include: invitationInclude,
    });
    return { invitation: invitationDto(latest), emailSent };
}

export async function revoke(
    actorId: string,
    invitationId: string,
    meta?: { ip?: string; userAgent?: string },
) {
    const { actor, invitation } = await findManageableInvitation(actorId, invitationId);
    if (invitation.status !== UserInvitationStatus.PENDING) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "Only pending invitations can be revoked.");
    }
    const revoked = await prisma.userInvitation.updateMany({
        where: { id: invitation.id, status: UserInvitationStatus.PENDING },
        data: { status: UserInvitationStatus.REVOKED, revokedAt: new Date() },
    });
    if (!revoked.count) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "Invitation changed. Refresh and try again.");
    }
    await writeAudit({
        userId: actor.id,
        action: "USER_INVITATION_REVOKED",
        resourceType: "USER_INVITATION",
        resourceId: invitation.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { email: invitation.email },
    });
    return { id: invitation.id, status: UserInvitationStatus.REVOKED };
}

export async function getPublicInvitation(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    let invitation = await prisma.userInvitation.findUnique({
        where: { tokenHash },
        include: invitationInclude,
    });
    if (!invitation) throw new ApiError(HTTP_STATUS.NOT_FOUND, "This invitation link is invalid.");
    if (invitation.status === UserInvitationStatus.PENDING && invitation.expiresAt <= new Date()) {
        await prisma.userInvitation.updateMany({
            where: { id: invitation.id, status: UserInvitationStatus.PENDING },
            data: { status: UserInvitationStatus.EXPIRED },
        });
        invitation = await prisma.userInvitation.findUniqueOrThrow({
            where: { id: invitation.id },
            include: invitationInclude,
        });
        await processExpiredInvitations();
    }
    if (invitation.status !== UserInvitationStatus.PENDING) {
        return {
            valid: false,
            status: invitation.status,
            invitedName: invitation.invitedName,
            email: invitation.email,
            role: invitation.role,
            branches: invitation.branches.map(({ branch }) => branch),
            invitedBy: { name: invitation.invitedBy.name },
            expiresAt: invitation.expiresAt,
        };
    }
    return {
        valid: true,
        status: invitation.status,
        invitedName: invitation.invitedName,
        email: invitation.email,
        role: invitation.role,
        branches: invitation.branches.map(({ branch }) => branch),
        invitedBy: { name: invitation.invitedBy.name },
        expiresAt: invitation.expiresAt,
    };
}

export async function accept(
    rawToken: string,
    input: AcceptInvitationInput,
    meta?: { ip?: string; userAgent?: string },
) {
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
        const accepted = await prisma.$transaction(async (tx) => {
            const invitation = await tx.userInvitation.findUnique({
                where: { tokenHash },
                include: {
                    role: true,
                    invitedBy: {
                        include: { role: true, branches: { select: { branchId: true } } },
                    },
                    branches: { include: { branch: true } },
                },
            });
            if (!invitation)
                throw new ApiError(HTTP_STATUS.NOT_FOUND, "This invitation link is invalid.");
            if (invitation.status !== UserInvitationStatus.PENDING) {
                throw new ApiError(
                    HTTP_STATUS.CONFLICT,
                    "This invitation has already been used or revoked.",
                );
            }
            if (invitation.expiresAt <= now) {
                // Throwing inside the transaction would roll back the EXPIRED status.
                throw new ApiError(
                    HTTP_STATUS.GONE,
                    "This invitation has expired. Ask the inviter to send a new one.",
                );
            }
            if (
                !invitation.invitedBy.isActive ||
                !invitation.invitedBy.isVerified ||
                !canManageUserWithRole(invitation.invitedBy.role.name, invitation.role.name)
            ) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    "The inviter can no longer grant this access. Contact an administrator.",
                );
            }
            if (invitation.branches.some(({ branch }) => !branch.isActive)) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    "One or more assigned branches are no longer active. Contact the inviter.",
                );
            }
            if (invitation.invitedBy.role.name === "DIRECTOR") {
                const inviterBranches = new Set(
                    invitation.invitedBy.branches.map(({ branchId }) => branchId),
                );
                if (
                    invitation.branches.length === 0 ||
                    invitation.branches.some(
                        ({ branchId, branch }) =>
                            !branch.isActive || !inviterBranches.has(branchId),
                    )
                ) {
                    throw new ApiError(
                        HTTP_STATUS.FORBIDDEN,
                        "The inviter no longer has access to all assigned branches. Contact an administrator.",
                    );
                }
            }
            if (
                await tx.user.findUnique({
                    where: { email: invitation.email },
                    select: { id: true },
                })
            ) {
                throw new ApiError(
                    HTTP_STATUS.CONFLICT,
                    "A user account already exists for this email.",
                );
            }
            const claimed = await tx.userInvitation.updateMany({
                where: {
                    id: invitation.id,
                    status: UserInvitationStatus.PENDING,
                    expiresAt: { gt: now },
                    tokenHash,
                },
                data: { status: UserInvitationStatus.ACCEPTED, acceptedAt: now },
            });
            if (!claimed.count)
                throw new ApiError(HTTP_STATUS.CONFLICT, "This invitation was already accepted.");

            const user = await tx.user.create({
                data: {
                    name: input.name,
                    email: invitation.email,
                    passwordHash,
                    roleId: invitation.roleId,
                    mobileNumber: input.mobileNumber?.trim() || null,
                    isActive: true,
                    isVerified: true,
                    branches: invitation.branches.length
                        ? {
                              create: invitation.branches.map(({ branchId }) => ({ branchId })),
                          }
                        : undefined,
                },
                select: { id: true },
            });
            await tx.userInvitation.update({
                where: { id: invitation.id },
                data: { acceptedUserId: user.id },
            });
            return { user, invitation };
        });
        await writeAudit({
            userId: accepted.user.id,
            action: "USER_INVITATION_ACCEPTED",
            resourceType: "USER_INVITATION",
            resourceId: accepted.invitation.id,
            ipAddress: meta?.ip,
            userAgent: meta?.userAgent,
            metadata: { inviterId: accepted.invitation.invitedById },
        });
        return { accepted: true, email: accepted.invitation.email };
    } catch (error) {
        if (error instanceof ApiError && error.statusCode === HTTP_STATUS.GONE) {
            await prisma.userInvitation.updateMany({
                where: { tokenHash, status: UserInvitationStatus.PENDING, expiresAt: { lte: now } },
                data: { status: UserInvitationStatus.EXPIRED },
            });
            await processExpiredInvitations();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ApiError(
                HTTP_STATUS.CONFLICT,
                "A user account already exists for this email.",
            );
        }
        throw error;
    }
}

export async function processExpiredInvitations() {
    const now = new Date();
    const staleClaimBefore = new Date(now.getTime() - EXPIRY_NOTICE_LEASE_MS);
    const candidates = await prisma.userInvitation.findMany({
        where: {
            status: { in: [UserInvitationStatus.PENDING, UserInvitationStatus.EXPIRED] },
            expiresAt: { lte: now },
            expiryEmailSentAt: null,
            OR: [
                { expiryEmailClaimedAt: null },
                { expiryEmailClaimedAt: { lt: staleClaimBefore } },
            ],
        },
        select: { id: true },
        take: 100,
    });
    for (const candidate of candidates) {
        const claimed = await prisma.userInvitation.updateMany({
            where: {
                id: candidate.id,
                status: { in: [UserInvitationStatus.PENDING, UserInvitationStatus.EXPIRED] },
                expiresAt: { lte: now },
                expiryEmailSentAt: null,
                OR: [
                    { expiryEmailClaimedAt: null },
                    { expiryEmailClaimedAt: { lt: staleClaimBefore } },
                ],
            },
            data: {
                status: UserInvitationStatus.EXPIRED,
                expiryEmailClaimedAt: now,
                expiryEmailAttempts: { increment: 1 },
            },
        });
        if (!claimed.count) continue;
        const invitation = await prisma.userInvitation.findUnique({
            where: { id: candidate.id },
            include: invitationInclude,
        });
        if (!invitation) continue;
        let sent = false;
        try {
            await sendInvitationExpiredNotice(invitationEmailDetails(invitation));
            await prisma.userInvitation.update({
                where: { id: invitation.id },
                data: {
                    expiryEmailSentAt: new Date(),
                    expiryEmailClaimedAt: null,
                    lastEmailError: null,
                },
            });
            sent = true;
        } catch (error) {
            logger.error(
                { invitationId: invitation.id, failureReason: safeEmailFailureReason(error) },
                "Invitation expiry notification failed; it will retry",
            );
            await prisma.userInvitation.update({
                where: { id: invitation.id },
                data: {
                    expiryEmailClaimedAt: null,
                    lastEmailError: "Expiry notification could not be delivered.",
                },
            });
        }
        if (sent) {
            try {
                await writeAudit({
                    userId: invitation.invitedById,
                    action: "USER_INVITATION_EXPIRED",
                    resourceType: "USER_INVITATION",
                    resourceId: invitation.id,
                    metadata: { email: invitation.email, expiryNoticeSent: true },
                });
            } catch (error) {
                // Mail is already delivered and marked, so audit failure must not trigger a duplicate email.
                logger.error(
                    { ...safeErrorMetadata(error), invitationId: invitation.id },
                    "Invitation expiry audit write failed",
                );
            }
        }
    }
}
