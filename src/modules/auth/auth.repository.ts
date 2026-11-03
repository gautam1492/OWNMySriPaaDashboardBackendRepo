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

export async function createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.refreshToken.create({ data });
}

export async function findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: { include: userAuthInclude } },
    });
}

export async function rotateRefreshToken(params: {
    storedId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.$transaction(async (tx) => {
        const created = await tx.refreshToken.create({
            data: {
                userId: params.userId,
                tokenHash: params.tokenHash,
                expiresAt: params.expiresAt,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
        await tx.refreshToken.update({
            where: { id: params.storedId },
            data: { revokedAt: new Date(), replacedByTokenId: created.id },
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

export async function revokeUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}

export async function changePasswordTransaction(userId: string, passwordHash: string) {
    return prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
        prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        }),
    ]);
}
