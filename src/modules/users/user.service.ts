import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import {
    effectiveRolePermissions,
    isPermissionAllowedForRole,
    PERMISSIONS,
} from "../../constants/permissions.js";
import { canManageUserWithRole, isCrossBranchRole, ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import { prisma } from "../../config/database.js";
import * as branchService from "../branches/branch.service.js";
import * as userRepository from "./user.repository.js";
import type {
    PermissionKey,
    PermissionGrantInput,
    RequestMeta,
    UserBranchesInput,
    UserCreateInput,
    UserListQuery,
    UserPatchInput,
    UserRoleInput,
    UserStatusInput,
} from "./user.types.js";

function withoutPasswordHash<T extends { passwordHash?: string }>(user: T) {
    const safe = { ...user };
    delete safe.passwordHash;
    return safe;
}

function auditMeta(actorId: string, meta?: RequestMeta) {
    return { userId: actorId, ipAddress: meta?.ip, userAgent: meta?.userAgent };
}

type BranchScopedActor = {
    id?: string;
    role: { name: string };
    branches: { branchId: string }[];
};

function assertBranchesWithinActor(actor: BranchScopedActor, branchIds: string[]) {
    if (actor.role.name !== ROLES.DIRECTOR) return;
    const allowed = new Set(actor.branches.map(({ branchId }) => branchId));
    if (branchIds.some((branchId) => !allowed.has(branchId))) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "Directors can assign users only to their own assigned branches.",
        );
    }
}

function assertTargetWithinActorBranches(
    actor: BranchScopedActor,
    target: BranchScopedActor & { id: string },
) {
    if (actor.role.name !== ROLES.DIRECTOR) return;
    const allowed = new Set(actor.branches.map(({ branchId }) => branchId));
    if (!target.branches.some(({ branchId }) => allowed.has(branchId))) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "You can manage users who share at least one of your assigned branches.",
        );
    }
}

function preserveOutOfScopeBranches(
    actor: BranchScopedActor,
    target: BranchScopedActor,
    requestedBranchIds: string[],
) {
    if (actor.role.name !== ROLES.DIRECTOR) return requestedBranchIds;
    const allowed = new Set(actor.branches.map(({ branchId }) => branchId));
    const existingOutOfScope = target.branches
        .map(({ branchId }) => branchId)
        .filter((branchId) => !allowed.has(branchId));
    return [...new Set([...existingOutOfScope, ...requestedBranchIds])];
}

function assertRoleManageable(actorRole: string, targetRoleId: string, targetRoleName: string) {
    if (
        !canManageUserWithRole(
            actorRole as (typeof ROLES)[keyof typeof ROLES],
            targetRoleName as (typeof ROLES)[keyof typeof ROLES],
        )
    ) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.HIERARCHY_VIOLATION);
    }
}

export async function listRoles() {
    return userRepository.findRoles();
}

export async function list(actorId: string, query: UserListQuery) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    const searchWhere: Prisma.UserWhereInput = query.search
        ? { OR: [{ name: { contains: query.search } }, { email: { contains: query.search } }] }
        : {};
    const where: Prisma.UserWhereInput =
        actor.role.name === ROLES.DIRECTOR
            ? {
                  AND: [
                      searchWhere,
                      {
                          OR: [
                              { id: actor.id },
                              {
                                  branches: {
                                      some: {
                                          branchId: {
                                              in: actor.branches.map(({ branchId }) => branchId),
                                          },
                                      },
                                  },
                              },
                          ],
                      },
                  ],
              }
            : searchWhere;
    const result = await userRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
    return {
        items: result.items.map((user) => {
            const visibleBranches =
                actor.role.name === ROLES.DIRECTOR
                    ? user.branches.filter(({ branchId }) =>
                          actor.branches.some((assigned) => assigned.branchId === branchId),
                      )
                    : user.branches;
            return {
                ...withoutPasswordHash(user),
                branchIds: visibleBranches.map(({ branchId }) => branchId),
                branches: visibleBranches.map(({ branch }) => branch),
            };
        }),
        total: result.total,
    };
}

export async function create(actorId: string, input: UserCreateInput, meta?: RequestMeta) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const targetRole = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { name: true },
    });
    if (!targetRole) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, input.roleId, targetRole.name);

    const { password, branchIds, ...data } = input;
    if (!isCrossBranchRole(targetRole.name) && (!branchIds || branchIds.length === 0)) {
        throw new ApiError(HTTP_STATUS.UNPROCESSABLE, MESSAGES.BRANCH_REQUIRED_FOR_ROLE, [
            { field: "branchIds", message: MESSAGES.BRANCH_REQUIRED_FOR_ROLE },
        ]);
    }
    assertBranchesWithinActor(actor, branchIds ?? []);
    for (const branchId of branchIds ?? []) {
        await branchService.getActiveById(branchId);
    }
    const passwordHash = await bcrypt.hash(password, 12);

    // Save branch assignments through the UserBranch relation.
    const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                ...data,
                email: data.email.toLowerCase(),
                passwordHash,
            },
            include: { role: true },
        });
        if (branchIds?.length) {
            await tx.userBranch.createMany({
                data: branchIds.map((branchId) => ({ userId: user.id, branchId })),
            });
        }
        return user;
    });
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "USER_CREATED",
        resourceType: "USER",
        resourceId: created.id,
    });
    return withoutPasswordHash(created);
}

export async function update(
    actorId: string,
    id: string,
    input: UserPatchInput,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(id);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    // All profile edits follow the target's role hierarchy; only SUPER_ADMIN can edit ADMIN users.
    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    let resultingRoleName = target.role.name;
    if (input.roleId) {
        const targetRole = await prisma.role.findUnique({
            where: { id: input.roleId },
            select: { name: true },
        });
        if (!targetRole) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        resultingRoleName = targetRole.name;
        assertRoleManageable(actor.role.name, input.roleId, targetRole.name);
    }

    const { branchIds, ...patch } = input;
    if (branchIds !== undefined) assertBranchesWithinActor(actor, branchIds);
    if (isCrossBranchRole(resultingRoleName) && branchIds?.length) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Organization-wide roles do not use branch assignments.",
        );
    }
    const roleChanged = input.roleId !== undefined && input.roleId !== target.role.id;
    const statusChanged = input.isActive !== undefined && input.isActive !== target.isActive;
    const effectiveBranchIds =
        branchIds === undefined ? undefined : preserveOutOfScopeBranches(actor, target, branchIds);
    if (branchIds !== undefined) {
        for (const branchId of branchIds) {
            await branchService.getActiveById(branchId);
        }
    }
    const data = {
        ...patch,
        ...(patch.email ? { email: patch.email.toLowerCase() } : {}),
    };
    const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id },
            data,
            include: { role: true },
        });
        if (
            branchIds !== undefined ||
            (roleChanged &&
                (isCrossBranchRole(resultingRoleName) || isCrossBranchRole(target.role.name)))
        ) {
            await tx.userBranch.deleteMany({ where: { userId: id } });
            if (effectiveBranchIds?.length) {
                await tx.userBranch.createMany({
                    data: effectiveBranchIds.map((branchId) => ({ userId: id, branchId })),
                });
            }
        }
        if (patch.isActive === false) {
            const now = new Date();
            await tx.authSession.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: now },
            });
            await tx.refreshToken.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: now },
            });
        }
        return user;
    });
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "USER_UPDATED",
        resourceType: "USER",
        resourceId: updated.id,
    });
    if (roleChanged) {
        await writeAudit({
            ...auditMeta(actorId, meta),
            action: "USER_ROLE_CHANGED",
            resourceType: "USER",
            resourceId: updated.id,
            metadata: { targetName: target.name, roleName: updated.role.name },
        });
    }
    if (statusChanged) {
        await writeAudit({
            ...auditMeta(actorId, meta),
            action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            resourceType: "USER",
            resourceId: updated.id,
            metadata: { targetName: target.name },
        });
    }
    return withoutPasswordHash(updated);
}

export async function updateStatus(
    actorId: string,
    id: string,
    input: UserStatusInput,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(id);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    if (target.isActive === input.isActive) return withoutPasswordHash(target);

    const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({ where: { id }, data: { isActive: input.isActive }, include: { role: true } });
        if (!input.isActive) {
            const now = new Date();
            await tx.authSession.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: now },
            });
            await tx.refreshToken.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: now },
            });
        }
        return user;
    });
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        resourceType: "USER",
        resourceId: updated.id,
        metadata: { targetName: target.name },
    });
    return withoutPasswordHash(updated);
}

export async function updateRole(
    actorId: string,
    id: string,
    input: UserRoleInput,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(id);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    const assignedRole = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { name: true },
    });
    if (!assignedRole) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    assertRoleManageable(actor.role.name, input.roleId, assignedRole.name);

    if (target.role.id === input.roleId) return withoutPasswordHash(target);

    const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id },
            data: { roleId: input.roleId },
            include: { role: true },
        });
        if (isCrossBranchRole(assignedRole.name) || isCrossBranchRole(target.role.name)) {
            await tx.userBranch.deleteMany({ where: { userId: id } });
        }
        return user;
    });
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "USER_ROLE_CHANGED",
        resourceType: "USER",
        resourceId: updated.id,
        metadata: { roleId: input.roleId, roleName: assignedRole.name, targetName: target.name },
    });
    return withoutPasswordHash(updated);
}

export async function updateBranches(
    actorId: string,
    id: string,
    input: UserBranchesInput,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(id);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);
    if (isCrossBranchRole(target.role.name)) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Organization-wide roles do not use branch assignments.",
        );
    }
    assertBranchesWithinActor(actor, input.branchIds);

    // Reject missing or inactive branches before replacing assignments.
    for (const bid of input.branchIds) {
        await branchService.getActiveById(bid);
    }

    const effectiveBranchIds = preserveOutOfScopeBranches(actor, target, input.branchIds);
    await userRepository.setBranches(id, effectiveBranchIds);
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "USER_BRANCH_CHANGED",
        resourceType: "USER",
        resourceId: id,
        metadata: { branchIds: input.branchIds },
    });
    return { id, branchIds: input.branchIds };
}

export async function deleteUser(actorId: string, id: string, meta?: RequestMeta) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const existing = await userRepository.findByIdWithRelations(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, existing.role.id, existing.role.name);
    assertTargetWithinActorBranches(actor, existing);

    await userRepository.remove(id);
    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "USER_DELETED",
        resourceType: "USER",
        resourceId: id,
        metadata: {
            targetName: existing.name,
            targetEmail: existing.email,
            branchIds: existing.branches.map(({ branchId }) => branchId),
        },
    });
}

export async function grantPermissions(
    actorId: string,
    targetUserId: string,
    input: PermissionGrantInput,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(targetUserId);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    if (input.permissionKeys.some((key) => !isPermissionAllowedForRole(target.role.name, key))) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "This permission cannot be granted to the selected role.",
        );
    }

    // Role defaults count as permissions held by the actor, just like individual grants.
    const actorPermissionKeys = new Set([
        ...effectiveRolePermissions(actor.role.name),
        ...actor.permissions
            .map((p) => p.permission.key as PermissionKey)
            .filter((key) => isPermissionAllowedForRole(actor.role.name, key)),
    ]);
    const actorHasAll = input.permissionKeys.every((k) =>
        actorPermissionKeys.has(k as PermissionKey),
    );
    if (!actorHasAll) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.INSUFFICIENT_PERMISSIONS);
    }

    const knownPermissionKeys = new Set(Object.values(PERMISSIONS));
    if (input.permissionKeys.some((key) => !knownPermissionKeys.has(key as PermissionKey))) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.PERMISSION_NOT_FOUND);
    }
    // Keep the permission table in sync with the code catalog so a missing seed
    // row cannot make a valid permission impossible to grant.
    const permissions = await Promise.all(
        input.permissionKeys.map((key) =>
            prisma.permission.upsert({
                where: { key },
                update: {},
                create: { key, name: key },
                select: { id: true, key: true },
            }),
        ),
    );

    const existingGrants = await prisma.userPermission.findMany({
        where: { userId: targetUserId },
        select: { permissionId: true },
    });
    const existingIds = new Set(existingGrants.map((g) => g.permissionId));
    const newPermissionIds = permissions.filter((p) => !existingIds.has(p.id)).map((p) => p.id);

    if (newPermissionIds.length === 0) {
        throw new ApiError(HTTP_STATUS.CONFLICT, MESSAGES.PERMISSION_ALREADY_GRANTED);
    }

    // Add grants without removing existing ones.
    await prisma.userPermission.createMany({
        data: newPermissionIds.map((permissionId) => ({
            userId: targetUserId,
            permissionId,
            grantedById: actorId,
        })),
    });

    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "PERMISSIONS_GRANTED",
        resourceType: "USER",
        resourceId: targetUserId,
        metadata: { permissionKeys: input.permissionKeys, targetName: target.name },
    });

    return { userId: targetUserId, granted: input.permissionKeys };
}

export async function revokePermission(
    actorId: string,
    targetUserId: string,
    permissionKey: string,
    meta?: RequestMeta,
) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const target = await userRepository.findByIdWithRelations(targetUserId);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    const permission = await prisma.permission.findUnique({
        where: { key: permissionKey },
        select: { id: true },
    });
    if (!permission) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.PERMISSION_NOT_FOUND);
    }

    const deleted = await prisma.userPermission.deleteMany({
        where: { userId: targetUserId, permissionId: permission.id },
    });

    if (deleted.count === 0) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.PERMISSION_NOT_FOUND);
    }

    await writeAudit({
        ...auditMeta(actorId, meta),
        action: "PERMISSION_REVOKED",
        resourceType: "USER",
        resourceId: targetUserId,
        metadata: { permissionKey, targetName: target.name },
    });

    return { userId: targetUserId, revoked: [permissionKey] };
}

export async function listUserPermissions(actorId: string, targetUserId = actorId) {
    const actor = await userRepository.findByIdWithRelations(actorId);
    if (!actor) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    const target = await userRepository.findByIdWithRelations(targetUserId);
    if (!target) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    assertRoleManageable(actor.role.name, target.role.id, target.role.name);
    assertTargetWithinActorBranches(actor, target);

    const [granted, storedCatalog] = await Promise.all([
        prisma.userPermission.findMany({
            where: { userId: targetUserId },
            include: { permission: true },
            orderBy: { grantedAt: "desc" },
        }),
        prisma.permission.findMany({
            orderBy: { key: "asc" },
            select: { key: true, name: true },
        }),
    ]);
    const storedNames = new Map(storedCatalog.map(({ key, name }) => [key, name]));
    const catalog = Object.values(PERMISSIONS)
        .map((key) => ({ key, name: storedNames.get(key) ?? key }))
        .sort((left, right) => left.key.localeCompare(right.key));

    return {
        userId: targetUserId,
        roleDefaults: effectiveRolePermissions(target.role.name),
        catalog,
        granted: granted
            .filter((g) => isPermissionAllowedForRole(target.role.name, g.permission.key))
            .map((g) => ({
                key: g.permission.key,
                name: g.permission.name,
                grantedBy: g.grantedById,
                grantedAt: g.grantedAt,
            })),
    };
}
