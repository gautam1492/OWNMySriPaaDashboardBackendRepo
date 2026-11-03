import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as miscellaneousExpenseController from "./miscellaneous-expense.controller.js";
import {
    miscellaneousExpenseListQuery,
    miscellaneousExpenseSchema,
    miscellaneousExpensePatchSchema,
} from "./miscellaneous-expense.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(miscellaneousExpenseListQuery),
    asyncHandler(miscellaneousExpenseController.list),
);
router.post(
    "/",
    authenticate,
    requirePermission("miscellaneousExpenses.create"),
    validate(miscellaneousExpenseSchema),
    asyncHandler(miscellaneousExpenseController.create),
);
router.get("/:id", authenticate, asyncHandler(miscellaneousExpenseController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("miscellaneousExpenses.update"),
    validate(miscellaneousExpensePatchSchema),
    asyncHandler(miscellaneousExpenseController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("miscellaneousExpenses.delete"),
    asyncHandler(miscellaneousExpenseController.remove),
);

export default router;
