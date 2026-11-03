import { Router } from "express";
import { PERMISSIONS } from "../../constants/permissions.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as workspaceController from "./workspace.controller.js";
import { workspaceSummaryQuery } from "./workspace.validator.js";

const router = Router();

router.get(
    "/summary",
    authenticate,
    requirePermission(PERMISSIONS.WORKSPACE_READ),
    validateQuery(workspaceSummaryQuery),
    asyncHandler(workspaceController.summary),
);

export default router;
