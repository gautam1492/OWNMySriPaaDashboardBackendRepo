import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/authorization.middleware.js";
import { validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as auditController from "./audit.controller.js";
import { auditListQuery } from "./audit.validator.js";

const router = Router();

router.get(
    "/filters",
    authenticate,
    requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.VIEWER_AUDITOR),
    asyncHandler(auditController.filters),
);

router.get(
    "/",
    authenticate,
    requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.VIEWER_AUDITOR),
    validateQuery(auditListQuery),
    asyncHandler(auditController.list),
);

export default router;
