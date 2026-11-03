import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as directorSalaryRepository from "./director-salary.repository.js";
import type {
    AuthUser,
    DirectorSalaryInput,
    DirectorSalaryPatchInput,
    RequestMeta,
} from "./director-salary.types.js";

function directorSalaryDto<
    T extends {
        directorUser: { id: string; name: string; email?: string } | null;
        director: { id: string; name: string } | null;
        directorUserId: string | null;
        directorId: string | null;
        directorNameSnapshot: string | null;
    },
>(salary: T) {
    const person = salary.directorUser ?? salary.director;
    const director = person
        ? { id: person.id, name: person.name }
        : salary.directorNameSnapshot
          ? { id: "", name: salary.directorNameSnapshot }
          : null;
    return {
        ...salary,
        directorId: salary.directorUserId ?? salary.directorId,
        director,
    };
}

async function activeDirectorUser(id: string) {
    const director = await prisma.user.findFirst({
        where: {
            id,
            isActive: true,
            isVerified: true,
            role: { name: ROLES.DIRECTOR },
        },
        select: { id: true, name: true },
    });
    if (!director) {
        throw new ApiError(
            HTTP_STATUS.UNPROCESSABLE,
            "Select an active, verified user with the Director role.",
        );
    }
    return director;
}

const MONTH_MAP: Record<
    number,
    | "JANUARY"
    | "FEBRUARY"
    | "MARCH"
    | "APRIL"
    | "MAY"
    | "JUNE"
    | "JULY"
    | "AUGUST"
    | "SEPTEMBER"
    | "OCTOBER"
    | "NOVEMBER"
    | "DECEMBER"
> = {
    1: "JANUARY",
    2: "FEBRUARY",
    3: "MARCH",
    4: "APRIL",
    5: "MAY",
    6: "JUNE",
    7: "JULY",
    8: "AUGUST",
    9: "SEPTEMBER",
    10: "OCTOBER",
    11: "NOVEMBER",
    12: "DECEMBER",
};

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.directorId) {
        where.OR = [{ directorUserId: query.directorId }, { directorId: query.directorId }];
    }
    if (query.month) where.month = MONTH_MAP[Number(query.month)];
    if (query.year) where.year = query.year;
    const result = await directorSalaryRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
    return { ...result, items: result.items.map(directorSalaryDto) };
}

export async function getById(id: string) {
    const item = await directorSalaryRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return directorSalaryDto(item);
}

export async function create(user: AuthUser, input: DirectorSalaryInput, meta?: RequestMeta) {
    const director = await activeDirectorUser(input.directorId);
    const created = await directorSalaryRepository.create({
        directorUserId: director.id,
        directorNameSnapshot: director.name,
        month: MONTH_MAP[input.month],
        year: input.year,
        amount: input.amount,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "DIRECTOR_SALARY_CREATED",
        resourceType: "DIRECTOR_SALARY",
        resourceId: created.id,
        metadata: {
            directorName: director.name,
            month: created.month,
            year: created.year,
            amount: created.amount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return directorSalaryDto(created);
}

export async function update(
    user: AuthUser,
    id: string,
    input: DirectorSalaryPatchInput,
    meta?: RequestMeta,
) {
    const found = await directorSalaryRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const director =
        input.directorId !== undefined ? await activeDirectorUser(input.directorId) : undefined;
    const updated = await directorSalaryRepository.update(id, {
        ...(director
            ? {
                  directorUserId: director.id,
                  directorNameSnapshot: director.name,
                  directorId: null,
              }
            : {}),
        ...(input.month !== undefined ? { month: MONTH_MAP[input.month] } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "DIRECTOR_SALARY_UPDATED",
        resourceType: "DIRECTOR_SALARY",
        resourceId: id,
        metadata: {
            directorName:
                found.directorUser?.name ?? found.director?.name ?? found.directorNameSnapshot,
            month: found.month,
            year: found.year,
            amount: found.amount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return directorSalaryDto(updated);
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await directorSalaryRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await directorSalaryRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "DIRECTOR_SALARY_DELETED",
        resourceType: "DIRECTOR_SALARY",
        resourceId: id,
        metadata: {
            directorName:
                found.directorUser?.name ?? found.director?.name ?? found.directorNameSnapshot,
            month: found.month,
            year: found.year,
            amount: found.amount.toString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
