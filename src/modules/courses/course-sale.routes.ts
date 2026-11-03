import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as courseSaleController from "./course-sale.controller.js";
import {
    courseSaleListQuery,
    courseSaleSchema,
    courseSalePatchSchema,
} from "./course-sale.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission("courses.read"),
    validateQuery(courseSaleListQuery),
    asyncHandler(courseSaleController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("courses.create"),
    validate(courseSaleSchema),
    asyncHandler(courseSaleController.create),
);
router.get(
    "/:id",
    authenticate,
    requirePermission("courses.read"),
    asyncHandler(courseSaleController.getById),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("courses.update"),
    validate(courseSalePatchSchema),
    asyncHandler(courseSaleController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("courses.delete"),
    asyncHandler(courseSaleController.remove),
);

export default router;
