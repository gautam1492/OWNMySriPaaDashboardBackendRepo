import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";
import type { DirectorListQuery } from "./director.types.js";

export async function list(query: DirectorListQuery) {
    const where: Prisma.UserWhereInput = {
        isActive: true,
        isVerified: true,
        role: { name: ROLES.DIRECTOR },
        ...(query.search
            ? {
                  OR: [{ name: { contains: query.search } }, { email: { contains: query.search } }],
              }
            : {}),
    };
    const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, isActive: true },
            orderBy: { name: "asc" },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
        }),
        prisma.user.count({ where }),
    ]);
    return { items, total };
}

export async function getById(id: string) {
    const director = await prisma.user.findFirst({
        where: { id, role: { name: ROLES.DIRECTOR } },
        select: { id: true, name: true, email: true, isActive: true },
    });
    if (!director) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Director user not found.");
    return director;
}
