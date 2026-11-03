import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { asDate } from "../../utils/dates.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as courseSaleRepository from "./course-sale.repository.js";
import type {
    AuthUser,
    CourseSaleInput,
    CourseSalePatchInput,
    RequestMeta,
} from "./course-sale.types.js";

export async function list(user: AuthUser, query: any) {
    const where: any = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.courseDoctorId) where.courseDoctorId = query.courseDoctorId;
    if (query.startDate || query.endDate) {
        where.purchaseDate = {
            ...(query.startDate ? { gte: asDate(query.startDate) } : {}),
            ...(query.endDate ? { lte: asDate(query.endDate) } : {}),
        };
    }
    return courseSaleRepository.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });
}

export async function getById(id: string) {
    const item = await courseSaleRepository.findById(id);
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    return item;
}

export async function create(user: AuthUser, input: CourseSaleInput, meta?: RequestMeta) {
    const numberOfCourses = input.numberOfCourses ?? 1;
    const pricePerCourse = Number(input.pricePerCourse);
    const discount = Number(input.discount ?? 0);
    const totalAmount = numberOfCourses * pricePerCourse - discount;

    const created = await courseSaleRepository.create({
        courseId: input.courseId,
        courseDoctorId: input.courseDoctorId,
        purchaseDate: asDate(input.purchaseDate),
        numberOfCourses,
        pricePerCourse,
        discount,
        totalAmount,
        customerId: input.customerId,
        membershipType: input.membershipType,
        createdById: user.id,
        updatedById: user.id,
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_SALE_CREATED",
        resourceType: "COURSE_SALE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    user: AuthUser,
    id: string,
    input: CourseSalePatchInput,
    meta?: RequestMeta,
) {
    const found = await courseSaleRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);

    const numberOfCourses = input.numberOfCourses ?? found.numberOfCourses;
    const pricePerCourse =
        input.pricePerCourse !== undefined
            ? Number(input.pricePerCourse)
            : Number(found.pricePerCourse);
    const discount = input.discount !== undefined ? Number(input.discount) : Number(found.discount);
    const totalAmount = numberOfCourses * pricePerCourse - discount;

    const updated = await courseSaleRepository.update(id, {
        ...(input.courseId !== undefined ? { courseId: input.courseId } : {}),
        ...(input.courseDoctorId !== undefined ? { courseDoctorId: input.courseDoctorId } : {}),
        ...(input.purchaseDate ? { purchaseDate: asDate(input.purchaseDate) } : {}),
        ...(input.numberOfCourses !== undefined ? { numberOfCourses } : {}),
        ...(input.pricePerCourse !== undefined ? { pricePerCourse } : {}),
        ...(input.discount !== undefined ? { discount } : {}),
        totalAmount,
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.membershipType !== undefined ? { membershipType: input.membershipType } : {}),
    });
    await writeAudit({
        userId: user.id,
        action: "COURSE_SALE_UPDATED",
        resourceType: "COURSE_SALE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function remove(user: AuthUser, id: string, meta?: RequestMeta) {
    const found = await courseSaleRepository.findById(id);
    if (!found) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.BRANCH_NOT_FOUND);
    await courseSaleRepository.remove(id);
    await writeAudit({
        userId: user.id,
        action: "COURSE_SALE_DELETED",
        resourceType: "COURSE_SALE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
