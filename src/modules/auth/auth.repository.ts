import { prisma } from "../../config/database.js";

const userAuthInclude = {
    role: true,
    branches: { select: { branchId: true } },
    permissions: { select: { permission: { select: { key: true } } } },
} as const;

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: userAuthInclude,
    });
}

export async function findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: userAuthInclude });
}

export async function findProfileById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            mobileNumber: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            role: { select: { id: true, name: true } },
            branches: {
                select: {
                    branch: { select: { id: true, name: true, code: true, isActive: true } },
                },
                orderBy: { branch: { name: "asc" } },
            },
        },
    });
}

export async function updateProfile(
    id: string,
    data: { name?: string; mobileNumber?: string | null },
) {
    return prisma.user.update({ where: { id }, data });
}

export async function updateLastLogin(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: { include: userAuthInclude }, session: true },
    });
}

export async function createSessionWithRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.$transaction(async (tx) => {
        const session = await tx.authSession.create({
            data: {
                userId: data.userId,
                expiresAt: data.expiresAt,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
        const token = await tx.refreshToken.create({
            data: { ...data, sessionId: session.id },
        });
        return { session, token };
    });
}

export async function ensureRefreshSession(
    refreshTokenId: string,
    userId: string,
    expiresAt: Date,
    meta: { ipAddress?: string; userAgent?: string },
) {
    return prisma.$transaction(async (tx) => {
        const token = await tx.refreshToken.findUnique({
            where: { id: refreshTokenId },
            select: { sessionId: true, expiresAt: true },
        });
        if (!token) return null;
        if (token.sessionId) {
            return tx.authSession.findUnique({ where: { id: token.sessionId } });
        }

        const session = await tx.authSession.create({
            data: {
                userId,
                expiresAt: token.expiresAt < expiresAt ? token.expiresAt : expiresAt,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
            },
        });
        const attached = await tx.refreshToken.updateMany({
            where: { id: refreshTokenId, sessionId: null },
            data: { sessionId: session.id },
        });
        if (attached.count) return session;

        await tx.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        const latest = await tx.refreshToken.findUnique({
            where: { id: refreshTokenId },
            select: { sessionId: true },
        });
        return latest?.sessionId
            ? tx.authSession.findUnique({ where: { id: latest.sessionId } })
            : null;
    });
}

export async function rotateRefreshToken(params: {
    storedId: string;
    userId: string;
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.$transaction(async (tx) => {
        const created = await tx.refreshToken.create({
            data: {
                userId: params.userId,
                sessionId: params.sessionId,
                tokenHash: params.tokenHash,
                expiresAt: params.expiresAt,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
        const claimed = await tx.refreshToken.updateMany({
            where: { id: params.storedId, revokedAt: null },
            data: { revokedAt: new Date(), replacedByTokenId: created.id },
        });
        if (!claimed.count) {
            await tx.refreshToken.delete({ where: { id: created.id } });
            return null;
        }
        await tx.authSession.update({
            where: { id: params.sessionId },
            data: { lastActiveAt: new Date() },
        });
        return created;
    });
}

export async function revokeRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}

export async function findSessionForUser(sessionId: string, userId: string, now: Date) {
    return prisma.authSession.findFirst({
        where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: now } },
        select: { id: true, lastActiveAt: true },
    });
}

export async function touchSession(sessionId: string, threshold: Date, now: Date) {
    await prisma.authSession.updateMany({
        where: { id: sessionId, revokedAt: null, lastActiveAt: { lt: threshold } },
        data: { lastActiveAt: now },
    });
}

export async function listActiveSessions(userId: string, now: Date) {
    return prisma.authSession.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            lastActiveAt: true,
            expiresAt: true,
        },
        orderBy: { lastActiveAt: "desc" },
    });
}

export async function revokeSession(userId: string, sessionId: string, now: Date) {
    return prisma.$transaction(async (tx) => {
        const session = await tx.authSession.updateMany({
            where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: now } },
            data: { revokedAt: now },
        });
        if (!session.count) return 0;
        await tx.refreshToken.updateMany({
            where: { sessionId, revokedAt: null },
            data: { revokedAt: now },
        });
        return session.count;
    });
}

export async function revokeOtherSessions(userId: string, currentSessionId: string, now: Date) {
    return prisma.$transaction(async (tx) => {
        const sessions = await tx.authSession.findMany({
            where: {
                userId,
                id: { not: currentSessionId },
                revokedAt: null,
                expiresAt: { gt: now },
            },
            select: { id: true },
        });
        const ids = sessions.map(({ id }) => id);
        if (!ids.length) return 0;
        await tx.authSession.updateMany({
            where: { id: { in: ids }, userId, revokedAt: null },
            data: { revokedAt: now },
        });
        await tx.refreshToken.updateMany({
            where: { sessionId: { in: ids }, revokedAt: null },
            data: { revokedAt: now },
        });
        return ids.length;
    });
}

export async function revokeAllSessions(userId: string, now: Date) {
    return prisma.$transaction(async (tx) => {
        const sessions = await tx.authSession.updateMany({
            where: { userId, revokedAt: null, expiresAt: { gt: now } },
            data: { revokedAt: now },
        });
        await tx.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now },
        });
        return sessions.count;
    });
}

export async function changePasswordTransaction(
    userId: string,
    currentSessionId: string,
    passwordHash: string,
) {
    return prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
        prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
                OR: [{ sessionId: { not: currentSessionId } }, { sessionId: null }],
            },
            data: { revokedAt: new Date() },
        }),
        prisma.authSession.updateMany({
            where: { userId, revokedAt: null, id: { not: currentSessionId } },
            data: { revokedAt: new Date() },
        }),
    ]);
}
