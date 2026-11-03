import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as courseRepository from "./course.repository.js";
import type { AuthUser, CourseInput, CoursePatchInput, RequestMeta } from "./course.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.search) {
        where.name = { contains: query.search };
    }
    if (query.courseDoctorId) {
        where.courseDoctorId = query.courseDoctorId;
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }
    return courseRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await courseRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CourseInput, meta?: RequestMeta) {
    const created = await courseRepository.create({
        name: input.name,
        courseDoctorId: input.courseDoctorId,
        isActive: input.isActive ?? true,
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_CREATED",
        resourceType: "COURSE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CoursePatchInput,
    meta?: RequestMeta,
) {
    const found = await courseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const updated = await courseRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.courseDoctorId !== undefined ? { courseDoctorId: input.courseDoctorId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_UPDATED",
        resourceType: "COURSE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await courseRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await courseRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "COURSE_DELETED",
        resourceType: "COURSE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
