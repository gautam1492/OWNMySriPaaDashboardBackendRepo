import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as userController from "./user.controller.js";
import {
    permissionGrantSchema,
    userBranchesSchema,
    userCreateSchema,
    userListQuery,
    userPatchSchema,
    userRoleSchema,
    userStatusSchema,
} from "./user.validator.js";
import {
    acceptInvitationSchema,
    createInvitationSchema,
    invitationListQuery,
} from "./invitation.validator.js";

export const userRoutes = Router();
const manager = [
    authenticate,
    requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
] as const;

userRoutes.get("/", ...manager, validateQuery(userListQuery), asyncHandler(userController.list));
userRoutes.get(
    "/invitations",
    ...manager,
    validateQuery(invitationListQuery),
    asyncHandler(userController.listInvitations),
);
userRoutes.post(
    "/invitations",
    ...manager,
    validate(createInvitationSchema),
    asyncHandler(userController.createInvitation),
);
userRoutes.post(
    "/invitations/:id/resend",
    ...manager,
    asyncHandler(userController.resendInvitation),
);
userRoutes.post(
    "/invitations/:id/revoke",
    ...manager,
    asyncHandler(userController.revokeInvitation),
);
// Retain the authenticated direct-create API for integrations during rollout.
userRoutes.post("/", ...manager, validate(userCreateSchema), asyncHandler(userController.create));
userRoutes.patch(
    "/:id",
    ...manager,
    validate(userPatchSchema),
    asyncHandler(userController.update),
);
userRoutes.patch(
    "/:id/status",
    ...manager,
    validate(userStatusSchema),
    asyncHandler(userController.updateStatus),
);
userRoutes.patch(
    "/:id/role",
    ...manager,
    validate(userRoleSchema),
    asyncHandler(userController.updateRole),
);
userRoutes.patch(
    "/:id/branches",
    ...manager,
    validate(userBranchesSchema),
    asyncHandler(userController.updateBranches),
);
userRoutes.delete("/:id", ...manager, asyncHandler(userController.remove));

/** Permission grants are limited to managed users and checked against the actor's grants. */
userRoutes.post(
    "/:id/permissions",
    ...manager,
    validate(permissionGrantSchema),
    asyncHandler(userController.grantPermissions),
);
userRoutes.delete(
    "/:id/permissions/:permissionKey",
    ...manager,
    asyncHandler(userController.revokePermission),
);
userRoutes.get("/:id/permissions", ...manager, asyncHandler(userController.listUserPermissions));

export const roleRoutes = Router();
roleRoutes.get("/", ...manager, asyncHandler(userController.listRoles));

export const userInvitationRoutes = Router();
const invitationPublicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
userInvitationRoutes.get(
    "/:token",
    invitationPublicLimiter,
    asyncHandler(userController.getPublicInvitation),
);
userInvitationRoutes.post(
    "/:token/accept",
    invitationPublicLimiter,
    validate(acceptInvitationSchema),
    asyncHandler(userController.acceptInvitation),
);
