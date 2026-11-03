import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as courseDoctorRepository from "./course-doctor.repository.js";
import type {
    AuthUser,
    CourseDoctorInput,
    CourseDoctorPatchInput,
    RequestMeta,
} from "./course-doctor.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.search) {
        where.name = { contains: query.search };
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }
    return courseDoctorRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await courseDoctorRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CourseDoctorInput, meta?: RequestMeta) {
    const created = await courseDoctorRepository.create({
        name: input.name,
        isActive: input.isActive ?? true,
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_DOCTOR_CREATED",
        resourceType: "COURSE_DOCTOR",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CourseDoctorPatchInput,
    meta?: RequestMeta,
) {
    const found = await courseDoctorRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    const updated = await courseDoctorRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_DOCTOR_UPDATED",
        resourceType: "COURSE_DOCTOR",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await courseDoctorRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await courseDoctorRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "COURSE_DOCTOR_DELETED",
        resourceType: "COURSE_DOCTOR",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
