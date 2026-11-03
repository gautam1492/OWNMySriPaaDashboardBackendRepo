import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as directorSalaryController from "./director-salary.controller.js";
import {
    directorSalaryListQuery,
    directorSalarySchema,
    directorSalaryPatchSchema,
} from "./director-salary.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(directorSalaryListQuery),
    asyncHandler(directorSalaryController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("directorSalaries.create"),
    validate(directorSalarySchema),
    asyncHandler(directorSalaryController.create),
);
router.get("/:id", authenticate, asyncHandler(directorSalaryController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("directorSalaries.update"),
    validate(directorSalaryPatchSchema),
    asyncHandler(directorSalaryController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("directorSalaries.delete"),
    asyncHandler(directorSalaryController.remove),
);

export default router;
