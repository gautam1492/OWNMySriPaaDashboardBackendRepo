import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as itemController from "./item.controller.js";
import { itemImportSchema, itemListQuery, itemPatchSchema, itemSchema } from "./item.validator.js";

const router = Router();

router.get("/", authenticate, validateQuery(itemListQuery), asyncHandler(itemController.list));
router.post(
    "/import",
    authenticate,
    requirePermission("items.create"),
    validate(itemImportSchema),
    asyncHandler(itemController.importMany),
);
router.post(
    "/",
    authenticate,
    requirePermission("items.create"),
    validate(itemSchema),
    asyncHandler(itemController.create),
);
router.get("/:id", authenticate, asyncHandler(itemController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("items.update"),
    validate(itemPatchSchema),
    asyncHandler(itemController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("items.delete"),
    asyncHandler(itemController.remove),
);

export default router;
