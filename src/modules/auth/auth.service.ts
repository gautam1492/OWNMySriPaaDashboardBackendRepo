import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import {
    effectiveRolePermissions,
    isPermissionAllowedForRole,
} from "../../constants/permissions.js";
import type { PermissionKey } from "../../constants/permissions.js";
import type { z } from "zod";
import { isCrossBranchRole } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";
import { parseDurationMs } from "../../utils/duration.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/database.js";
import { sendPasswordResetEmail } from "./auth-email.service.js";
import { writeAudit } from "../audit/audit.service.js";
import { safeErrorMetadata } from "../../utils/safeError.js";
import * as authRepository from "./auth.repository.js";
import type { AuthTokens, AuthUser, RequestMeta } from "./auth.types.js";
import type { profilePatchSchema } from "./auth.validator.js";

export function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user: AuthUser) {
    return jwt.sign(
        {
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            role: user.role,
            branchIds: user.branchIds,
            permissions: user.permissions,
        },
        env.JWT_ACCESS_SECRET,
        { subject: user.id, expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );
}

/** Resolve current authorization data so role and branch changes take effect immediately. */
export async function getCurrentAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.isActive || !user.isVerified) return null;
    return toAuthUser(user);
}

export function accessTokenMaxAgeMs() {
    return parseDurationMs(env.JWT_ACCESS_EXPIRES_IN);
}

export function accessTokenExpiresAt() {
    return new Date(Date.now() + accessTokenMaxAgeMs()).toISOString();
}

export function refreshTokenMaxAgeMs() {
    return parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & {
        sub: string;
        role: AuthUser["role"];
        branchIds: string[];
        permissions: string[];
    };
}

export function decodeUserIdAllowingExpiry(token: string | undefined): string | undefined {
    if (!token) return undefined;
    try {
        return verifyAccessToken(token).sub;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const payload = jwt.decode(token) as (jwt.JwtPayload & { sub?: string }) | null;
            return payload?.sub;
        }
        return undefined;
    }
}

function refreshExpiry() {
    return new Date(Date.now() + refreshTokenMaxAgeMs());
}

type AuthUserWithRelations = {
    id: string;
    name: string;
    email: string;
    roleId: string;
    role: { name: AuthUser["role"] };
    branches: { branchId: string }[];
    permissions: { permission: { key: string } }[];
};

function toAuthUser(user: AuthUserWithRelations): AuthUser {
    const roleDefaults = effectiveRolePermissions(user.role.name);
    const allowed = (key: string) => isPermissionAllowedForRole(user.role.name, key);
    const grantedKeys = user.permissions
        .map((p) => p.permission.key as PermissionKey)
        .filter(allowed);
    const effectivePermissions = [...new Set([...roleDefaults.filter(allowed), ...grantedKeys])];
    const branchIds = isCrossBranchRole(user.role.name) ? [] : user.branches.map((b) => b.branchId);

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.role.name,
        branchIds,
        permissions: effectivePermissions,
    };
}

export async function login(
    email: string,
    password: string,
    meta: RequestMeta,
): Promise<AuthTokens> {
    const user = await authRepository.findUserByEmail(email);
    if (
        !user ||
        !user.isActive ||
        !user.isVerified ||
        !(await bcrypt.compare(password, user.passwordHash))
    ) {
        await writeAudit({
            userId: user?.id,
            action: "LOGIN_FAILED",
            resourceType: "AUTH",
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
        });
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
    }
    const rawRefresh = crypto.randomBytes(48).toString("base64url");
    const token = await authRepository.createRefreshToken({
        userId: user.id,
        tokenHash: hashToken(rawRefresh),
        expiresAt: refreshExpiry(),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
    });
    await authRepository.updateLastLogin(user.id);
    const authUser = toAuthUser(user);
    await writeAudit({
        userId: user.id,
        action: "LOGIN",
        resourceType: "AUTH",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
    });
    return {
        accessToken: signAccessToken(authUser),
        accessTokenExpiresAt: accessTokenExpiresAt(),
        refreshToken: rawRefresh,
        user: authUser,
        refreshTokenId: token.id,
    };
}

type ProfilePatchInput = z.infer<typeof profilePatchSchema>;

export async function getProfile(userId: string) {
    const user = await authRepository.findProfileById(userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User profile not found.");
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        role: user.role,
        branches: isCrossBranchRole(user.role.name)
            ? []
            : user.branches.map(({ branch }) => branch),
        hasCrossBranchAccess: isCrossBranchRole(user.role.name),
    };
}

export async function updateProfile(userId: string, input: ProfilePatchInput, meta: RequestMeta) {
    const updated = await authRepository.updateProfile(userId, input);
    await writeAudit({
        userId,
        action: "PROFILE_UPDATED",
        resourceType: "USER",
        resourceId: userId,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: { updatedFields: Object.keys(input) },
    });
    return getProfile(updated.id);
}

export async function refresh(
    rawRefresh: string | undefined,
    meta: RequestMeta,
): Promise<AuthTokens> {
    if (!rawRefresh) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.REFRESH_TOKEN_REQUIRED);
    }
    const stored = await authRepository.findRefreshTokenByHash(hashToken(rawRefresh));
    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }
    if (stored.revokedAt) {
        // Refresh-token reuse: revoke the whole family so a stolen token cannot be replayed.
        await authRepository.revokeUserRefreshTokens(stored.userId);
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }
    const nextRaw = crypto.randomBytes(48).toString("base64url");
    const next = await authRepository.rotateRefreshToken({
        storedId: stored.id,
        userId: stored.userId,
        tokenHash: hashToken(nextRaw),
        expiresAt: refreshExpiry(),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
    });
    const user = toAuthUser(stored.user);
    return {
        accessToken: signAccessToken(user),
        accessTokenExpiresAt: accessTokenExpiresAt(),
        refreshToken: nextRaw,
        user,
        refreshTokenId: next.id,
    };
}

export async function logout(rawRefresh: string | undefined, meta: RequestMeta, userId?: string) {
    if (rawRefresh) {
        const stored = await authRepository.findRefreshTokenByHash(hashToken(rawRefresh));
        if (stored) {
            await authRepository.revokeRefreshTokenByHash(hashToken(rawRefresh));
            await writeAudit({
                userId: stored.userId,
                action: "LOGOUT",
                resourceType: "AUTH",
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
            });
            return;
        }
    }
    // No session to revoke and no identifiable actor: stay silent so the public
    // endpoint cannot be used to spam the audit log.
    if (!userId) return;
    await writeAudit({
        userId,
        action: "LOGOUT",
        resourceType: "AUTH",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
    });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.CURRENT_PASSWORD_INCORRECT);
    }
    await authRepository.changePasswordTransaction(userId, await bcrypt.hash(newPassword, 12));
    await writeAudit({
        userId,
        action: "PASSWORD_CHANGED",
        resourceType: "AUTH",
        resourceId: userId,
    });
}

const PASSWORD_RESET_LIFETIME_MS = 30 * 60 * 1000;

export type PasswordResetRequestResult =
    "not-found" | "not-eligible" | "cooldown" | "sent" | "delivery-failed";

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, email: true, isActive: true, isVerified: true },
    });
    // Never create a token or send mail unless this address belongs to an active,
    // verified user account.
    if (!user) return "not-found";
    if (!user.isActive || !user.isVerified) return "not-eligible";

    const now = new Date();
    const cooldownSince = new Date(now.getTime() - 60 * 1000);
    const recentRequest = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, createdAt: { gt: cooldownSince } },
        select: { id: true },
    });
    if (recentRequest) return "cooldown";

    const rawToken = crypto.randomBytes(32).toString("base64url");
    await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: now },
        }),
        prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(rawToken),
                expiresAt: new Date(now.getTime() + PASSWORD_RESET_LIFETIME_MS),
            },
        }),
    ]);

    try {
        await sendPasswordResetEmail(user.email, user.name, rawToken);
        return "sent";
    } catch (error) {
        logger.error(
            { ...safeErrorMetadata(error), userId: user.id },
            "Password reset email delivery failed",
        );
        return "delivery-failed";
    }
}

export async function resetPassword(rawToken: string, password: string) {
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
        const token = await tx.passwordResetToken.findUnique({
            where: { tokenHash },
            select: { id: true, userId: true, expiresAt: true, usedAt: true },
        });
        if (!token || token.usedAt || token.expiresAt <= now) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "This password reset link is invalid or expired.",
            );
        }
        const claimed = await tx.passwordResetToken.updateMany({
            where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
            data: { usedAt: now },
        });
        if (!claimed.count) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "This password reset link is invalid or expired.",
            );
        }
        const user = await tx.user.findUnique({
            where: { id: token.userId },
            select: { id: true, email: true, isActive: true, isVerified: true },
        });
        if (!user?.isActive || !user.isVerified) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "This password reset link is invalid or expired.",
            );
        }
        await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
        await tx.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: now },
        });
        await tx.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: now },
        });
        return { id: user.id, email: user.email };
    });
    await writeAudit({
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        resourceType: "AUTH",
        resourceId: user.id,
    });
    return { email: user.email };
}
