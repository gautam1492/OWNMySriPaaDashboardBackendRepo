import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as coreInvestmentController from "./core-investment.controller.js";
import {
    coreInvestmentListQuery,
    coreInvestmentSchema,
    coreInvestmentPatchSchema,
} from "./core-investment.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission("coreInvestments.read"),
    validateQuery(coreInvestmentListQuery),
    asyncHandler(coreInvestmentController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("coreInvestments.create"),
    validate(coreInvestmentSchema),
    asyncHandler(coreInvestmentController.create),
);
router.get(
    "/:id",
    authenticate,
    requirePermission("coreInvestments.read"),
    asyncHandler(coreInvestmentController.getById),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("coreInvestments.update"),
    validate(coreInvestmentPatchSchema),
    asyncHandler(coreInvestmentController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("coreInvestments.delete"),
    asyncHandler(coreInvestmentController.remove),
);

export default router;
