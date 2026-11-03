import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as courseController from "./course.controller.js";
import { courseListQuery, courseSchema, coursePatchSchema } from "./course.validator.js";

const router = Router();

router.get("/", authenticate, validateQuery(courseListQuery), asyncHandler(courseController.list));
router.post(
    "/",
    authenticate,
    requirePermission("courses.create"),
    validate(courseSchema),
    asyncHandler(courseController.create),
);
router.get("/:id", authenticate, asyncHandler(courseController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("courses.update"),
    validate(coursePatchSchema),
    asyncHandler(courseController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("courses.delete"),
    asyncHandler(courseController.remove),
);

export default router;
