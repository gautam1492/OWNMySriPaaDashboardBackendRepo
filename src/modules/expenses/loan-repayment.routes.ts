import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as loanRepaymentController from "./loan-repayment.controller.js";
import {
    loanRepaymentListQuery,
    loanRepaymentSchema,
    loanRepaymentPatchSchema,
} from "./loan-repayment.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(loanRepaymentListQuery),
    asyncHandler(loanRepaymentController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("loanRepayments.create"),
    validate(loanRepaymentSchema),
    asyncHandler(loanRepaymentController.create),
);
router.get("/:id", authenticate, asyncHandler(loanRepaymentController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("loanRepayments.update"),
    validate(loanRepaymentPatchSchema),
    asyncHandler(loanRepaymentController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("loanRepayments.delete"),
    asyncHandler(loanRepaymentController.remove),
);

export default router;
