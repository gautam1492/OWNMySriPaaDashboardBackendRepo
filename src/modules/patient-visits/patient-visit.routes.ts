import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as visitController from "./patient-visit.controller.js";
import { visitListQuery, visitPatchSchema, visitSchema } from "./patient-visit.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(visitListQuery),
    requirePermission("visits.read"),
    asyncHandler(visitController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("visits.create"),
    validate(visitSchema),
    asyncHandler(visitController.create),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("visits.update"),
    validate(visitPatchSchema),
    asyncHandler(visitController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("visits.delete"),
    asyncHandler(visitController.remove),
);

export default router;
