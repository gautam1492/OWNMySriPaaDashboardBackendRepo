import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as feedbackController from "./feedback.controller.js";
import { feedbackListQuery, feedbackPatchSchema, feedbackSchema } from "./feedback.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(feedbackListQuery),
    asyncHandler(feedbackController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("feedback.create"),
    validate(feedbackSchema),
    asyncHandler(feedbackController.create),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("feedback.update"),
    validate(feedbackPatchSchema),
    asyncHandler(feedbackController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("feedback.delete"),
    asyncHandler(feedbackController.remove),
);

export default router;
