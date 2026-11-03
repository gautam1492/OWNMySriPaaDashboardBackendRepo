import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as otherExpenseController from "./other-expense.controller.js";
import {
    otherExpenseListQuery,
    otherExpenseSchema,
    otherExpensePatchSchema,
} from "./other-expense.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(otherExpenseListQuery),
    asyncHandler(otherExpenseController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("otherExpenses.create"),
    validate(otherExpenseSchema),
    asyncHandler(otherExpenseController.create),
);
router.get("/:id", authenticate, asyncHandler(otherExpenseController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("otherExpenses.update"),
    validate(otherExpensePatchSchema),
    asyncHandler(otherExpenseController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("otherExpenses.delete"),
    asyncHandler(otherExpenseController.remove),
);

export default router;
