import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as serviceController from "./service.controller.js";
import { servicePatchSchema, serviceSchema } from "./service.validator.js";

const router = Router();

router.get("/", authenticate, asyncHandler(serviceController.list));
router.post(
    "/",
    authenticate,
    requirePermission("services.create"),
    validate(serviceSchema),
    asyncHandler(serviceController.create),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("services.update"),
    validate(servicePatchSchema),
    asyncHandler(serviceController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("services.delete"),
    asyncHandler(serviceController.remove),
);

export default router;
