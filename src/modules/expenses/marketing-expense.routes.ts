import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as marketingExpenseController from "./marketing-expense.controller.js";
import {
    marketingExpenseListQuery,
    marketingExpenseSchema,
    marketingExpensePatchSchema,
} from "./marketing-expense.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(marketingExpenseListQuery),
    asyncHandler(marketingExpenseController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("marketingExpenses.create"),
    validate(marketingExpenseSchema),
    asyncHandler(marketingExpenseController.create),
);
router.get("/:id", authenticate, asyncHandler(marketingExpenseController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("marketingExpenses.update"),
    validate(marketingExpensePatchSchema),
    asyncHandler(marketingExpenseController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("marketingExpenses.delete"),
    asyncHandler(marketingExpenseController.remove),
);

export default router;
