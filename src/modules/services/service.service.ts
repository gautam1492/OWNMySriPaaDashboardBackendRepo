import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../audit/audit.service.js";
import * as serviceRepository from "./service.repository.js";
import type { RequestMeta, ServiceInput, ServicePatchInput } from "./service.types.js";

export async function listActive() {
    return serviceRepository.findActiveMany();
}

export async function create(actorId: string, input: ServiceInput, meta?: RequestMeta) {
    const created = await serviceRepository.create(input);
    await writeAudit({
        userId: actorId,
        action: "SERVICE_CREATED",
        resourceType: "SERVICE",
        resourceId: created.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return created;
}

export async function update(
    actorId: string,
    id: string,
    input: ServicePatchInput,
    meta?: RequestMeta,
) {
    const updated = await serviceRepository.update(id, input);
    await writeAudit({
        userId: actorId,
        action: "SERVICE_UPDATED",
        resourceType: "SERVICE",
        resourceId: updated.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return updated;
}

export async function deleteService(actorId: string, id: string, meta?: RequestMeta) {
    const existing = await serviceRepository.findById(id);
    if (!existing) throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.SERVICE_NOT_FOUND);
    await serviceRepository.remove(id);
    await writeAudit({
        userId: actorId,
        action: "SERVICE_DELETED",
        resourceType: "SERVICE",
        resourceId: id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
}
