import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as medicinePurchaseController from "./medicine-purchase.controller.js";
import {
    medicinePurchaseListQuery,
    medicinePurchaseSchema,
    medicinePurchasePatchSchema,
} from "./medicine-purchase.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(medicinePurchaseListQuery),
    asyncHandler(medicinePurchaseController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("medicinePurchases.create"),
    validate(medicinePurchaseSchema),
    asyncHandler(medicinePurchaseController.create),
);
router.get("/:id", authenticate, asyncHandler(medicinePurchaseController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("medicinePurchases.update"),
    validate(medicinePurchasePatchSchema),
    asyncHandler(medicinePurchaseController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("medicinePurchases.delete"),
    asyncHandler(medicinePurchaseController.remove),
);

export default router;
