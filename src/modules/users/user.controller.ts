import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { MESSAGES } from "../../constants/messages.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getRequestMeta } from "../../utils/requestMeta.js";
import * as userService from "./user.service.js";
import type { UserListQuery } from "./user.types.js";
import * as invitationService from "./invitation.service.js";
import type { InvitationListQuery } from "./invitation.validator.js";

export async function listRoles(_req: Request, res: Response) {
    return ApiResponse.success(res, await userService.listRoles());
}

export async function listInvitations(req: Request, res: Response) {
    const query = req.query as InvitationListQuery;
    const result = await invitationService.list(req.user!.id, query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function createInvitation(req: Request, res: Response) {
    const result = await invitationService.create(req.user!.id, req.body, getRequestMeta(req));
    return ApiResponse.success(
        res,
        result,
        result.emailSent
            ? "Invitation sent"
            : "Invitation created, but email delivery failed. Resend it after checking the mail configuration.",
        HTTP_STATUS.CREATED,
    );
}

export async function resendInvitation(req: Request, res: Response) {
    const result = await invitationService.resend(
        req.user!.id,
        String(req.params.id),
        getRequestMeta(req),
    );
    return ApiResponse.success(
        res,
        result,
        result.emailSent
            ? "Invitation resent with a new link"
            : "A new link was created, but email delivery failed.",
    );
}

export async function revokeInvitation(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await invitationService.revoke(req.user!.id, String(req.params.id), getRequestMeta(req)),
        "Invitation revoked",
    );
}

export async function getPublicInvitation(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await invitationService.getPublicInvitation(String(req.params.token ?? req.body.token)),
    );
}

export async function acceptInvitation(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await invitationService.accept(
            String(req.params.token ?? req.body.token),
            req.body,
            getRequestMeta(req),
        ),
        "Invitation accepted. You can now sign in.",
        HTTP_STATUS.CREATED,
    );
}

export async function list(req: Request, res: Response) {
    const query = req.query as UserListQuery;
    const result = await userService.list(req.user!.id, query);
    return ApiResponse.paginated(res, result.items, query.page, query.limit, result.total);
}

export async function create(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.create(req.user!.id, req.body, getRequestMeta(req)),
        MESSAGES.USER_CREATED,
        HTTP_STATUS.CREATED,
    );
}

export async function update(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.update(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.USER_UPDATED,
    );
}

export async function updateStatus(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.updateStatus(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.USER_STATUS_UPDATED,
    );
}

export async function updateRole(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.updateRole(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.USER_ROLE_UPDATED,
    );
}

export async function updateBranches(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.updateBranches(
            req.user!.id,
            String(req.params.id),
            req.body,
            getRequestMeta(req),
        ),
        MESSAGES.USER_BRANCH_UPDATED,
    );
}

export async function remove(req: Request, res: Response) {
    await userService.deleteUser(req.user!.id, String(req.params.id), getRequestMeta(req));
    return ApiResponse.success(res, null, MESSAGES.USER_DELETED);
}

export async function grantPermissions(req: Request, res: Response) {
    const result = await userService.grantPermissions(
        req.user!.id,
        String(req.params.id),
        req.body,
        getRequestMeta(req),
    );
    return ApiResponse.success(res, result, MESSAGES.PERMISSION_GRANTED, HTTP_STATUS.CREATED);
}

export async function revokePermission(req: Request, res: Response) {
    const result = await userService.revokePermission(
        req.user!.id,
        String(req.params.id),
        String(req.params.permissionKey),
        getRequestMeta(req),
    );
    return ApiResponse.success(res, result, MESSAGES.PERMISSION_REVOKED);
}

export async function listUserPermissions(req: Request, res: Response) {
    return ApiResponse.success(
        res,
        await userService.listUserPermissions(req.user!.id, String(req.params.id)),
    );
}
