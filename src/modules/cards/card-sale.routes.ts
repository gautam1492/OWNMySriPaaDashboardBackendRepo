import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as cardSaleController from "./card-sale.controller.js";
import { cardSaleListQuery, cardSaleSchema, cardSalePatchSchema } from "./card-sale.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission("cards.read"),
    validateQuery(cardSaleListQuery),
    asyncHandler(cardSaleController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("cards.create"),
    validate(cardSaleSchema),
    asyncHandler(cardSaleController.create),
);
router.get(
    "/:id",
    authenticate,
    requirePermission("cards.read"),
    asyncHandler(cardSaleController.getById),
);
router.patch(
    "/:id",
    authenticate,
    requirePermission("cards.update"),
    validate(cardSalePatchSchema),
    asyncHandler(cardSaleController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("cards.delete"),
    asyncHandler(cardSaleController.remove),
);

export default router;
