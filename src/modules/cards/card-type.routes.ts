import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as cardTypeController from "./card-type.controller.js";
import { cardTypeListQuery, cardTypeSchema, cardTypePatchSchema } from "./card-type.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(cardTypeListQuery),
    asyncHandler(cardTypeController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("cards.create"),
    validate(cardTypeSchema),
    asyncHandler(cardTypeController.create),
);
router.get("/:id", authenticate, asyncHandler(cardTypeController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("cards.update"),
    validate(cardTypePatchSchema),
    asyncHandler(cardTypeController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("cards.delete"),
    asyncHandler(cardTypeController.remove),
);

export default router;
