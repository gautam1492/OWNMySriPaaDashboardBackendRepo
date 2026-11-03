import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as saleController from "./sale.controller.js";
import { saleListQuery, saleSchema } from "./sale.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(saleListQuery),
    requirePermission("sales.read"),
    asyncHandler(saleController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("sales.create"),
    validate(saleSchema),
    asyncHandler(saleController.create),
);
router.get(
    "/:id",
    authenticate,
    requirePermission("sales.read"),
    asyncHandler(saleController.getById),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("sales.update"),
    validate(saleSchema),
    asyncHandler(saleController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("sales.delete"),
    asyncHandler(saleController.remove),
);

export default router;
