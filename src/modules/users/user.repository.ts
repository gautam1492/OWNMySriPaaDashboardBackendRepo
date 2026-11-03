import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const userInclude = { role: true } as const;

export async function findRoles() {
    return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function list(params: { where: Prisma.UserWhereInput; skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
            where: params.where,
            include: {
                ...userInclude,
                branches: {
                    select: {
                        branchId: true,
                        branch: { select: { id: true, name: true, code: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        prisma.user.count({ where: params.where }),
    ]);
    return { items, total };
}

export async function findByIdWithRelations(id: string) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            role: true,
            branches: { select: { branchId: true } },
            permissions: { select: { permission: { select: { key: true } } } },
        },
    });
}

export async function create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({ data, include: userInclude });
}

export async function update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return prisma.user.update({ where: { id }, data, include: userInclude });
}

export async function remove(id: string) {
    return prisma.user.delete({ where: { id } });
}

/** Replace all branch assignments for a user within a transaction. */
export async function setBranches(userId: string, branchIds: string[]) {
    return prisma.$transaction([
        prisma.userBranch.deleteMany({ where: { userId } }),
        branchIds.length > 0
            ? prisma.userBranch.createMany({
                  data: branchIds.map((branchId) => ({ userId, branchId })),
              })
            : prisma.$queryRaw`SELECT 1`,
    ]);
}

/** Replace all granted permissions for a user within a transaction. */
export async function setPermissions(userId: string, permissionIds: string[], grantedById: string) {
    return prisma.$transaction([
        prisma.userPermission.deleteMany({ where: { userId } }),
        permissionIds.length > 0
            ? prisma.userPermission.createMany({
                  data: permissionIds.map((permissionId) => ({
                      userId,
                      permissionId,
                      grantedById,
                  })),
              })
            : prisma.$queryRaw`SELECT 1`,
    ]);
}
