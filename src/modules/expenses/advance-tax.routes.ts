import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as advanceTaxController from "./advance-tax.controller.js";
import {
    advanceTaxListQuery,
    advanceTaxSchema,
    advanceTaxPatchSchema,
} from "./advance-tax.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(advanceTaxListQuery),
    asyncHandler(advanceTaxController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("advanceTaxes.create"),
    validate(advanceTaxSchema),
    asyncHandler(advanceTaxController.create),
);
router.get("/:id", authenticate, asyncHandler(advanceTaxController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("advanceTaxes.update"),
    validate(advanceTaxPatchSchema),
    asyncHandler(advanceTaxController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("advanceTaxes.delete"),
    asyncHandler(advanceTaxController.remove),
);

export default router;
