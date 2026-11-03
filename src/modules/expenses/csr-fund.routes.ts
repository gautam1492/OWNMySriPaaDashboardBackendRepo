import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as csrFundController from "./csr-fund.controller.js";
import { csrFundListQuery, csrFundSchema, csrFundPatchSchema } from "./csr-fund.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(csrFundListQuery),
    asyncHandler(csrFundController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("csrFunds.create"),
    validate(csrFundSchema),
    asyncHandler(csrFundController.create),
);
router.get("/:id", authenticate, asyncHandler(csrFundController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("csrFunds.update"),
    validate(csrFundPatchSchema),
    asyncHandler(csrFundController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("csrFunds.delete"),
    asyncHandler(csrFundController.remove),
);

export default router;
