import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as courseDoctorController from "./course-doctor.controller.js";
import {
    courseDoctorListQuery,
    courseDoctorSchema,
    courseDoctorPatchSchema,
} from "./course-doctor.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(courseDoctorListQuery),
    asyncHandler(courseDoctorController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("courses.create"),
    validate(courseDoctorSchema),
    asyncHandler(courseDoctorController.create),
);
router.get("/:id", authenticate, asyncHandler(courseDoctorController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("courses.update"),
    validate(courseDoctorPatchSchema),
    asyncHandler(courseDoctorController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("courses.delete"),
    asyncHandler(courseDoctorController.remove),
);

export default router;
