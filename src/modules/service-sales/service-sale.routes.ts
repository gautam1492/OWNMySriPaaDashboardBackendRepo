import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as serviceSaleController from "./service-sale.controller.js";
import { serviceSaleListQuery, serviceSaleSchema } from "./service-sale.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(serviceSaleListQuery),
    requirePermission("serviceSales.read"),
    asyncHandler(serviceSaleController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("serviceSales.create"),
    validate(serviceSaleSchema),
    asyncHandler(serviceSaleController.create),
);
router.get(
    "/:id",
    authenticate,
    requirePermission("serviceSales.read"),
    asyncHandler(serviceSaleController.getById),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("serviceSales.update"),
    validate(serviceSaleSchema),
    asyncHandler(serviceSaleController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("serviceSales.delete"),
    asyncHandler(serviceSaleController.remove),
);

export default router;
