import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/authorization.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as dashboardController from "./dashboard.controller.js";
import { periodQuery } from "./dashboard.validator.js";

const router = Router();
const dashboardAccess = [
    authenticate,
    requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.ACCOUNTS_FINANCE),
] as const;

router.get(
    "/summary",
    ...dashboardAccess,
    validateQuery(periodQuery),
    asyncHandler(dashboardController.summary),
);
router.get(
    "/trends",
    ...dashboardAccess,
    validateQuery(periodQuery),
    asyncHandler(dashboardController.trends),
);
router.get(
    "/branch-visit-trends",
    ...dashboardAccess,
    validateQuery(periodQuery),
    asyncHandler(dashboardController.branchVisitTrends),
);

export default router;
