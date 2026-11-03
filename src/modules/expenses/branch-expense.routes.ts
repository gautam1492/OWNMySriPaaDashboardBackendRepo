import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as branchExpenseController from "./branch-expense.controller.js";
import {
    branchExpenseKinds,
    branchExpenseListQuery,
    branchExpenseSchemas,
    branchExpensePatchSchemas,
} from "./branch-expense.validator.js";

const router = Router();
const routeNames = {
    salary: "salaries",
    rent: "rent",
    waterBill: "water-bills",
    powerBill: "power-bills",
    foodGroceries: "food-groceries",
    governmentFee: "government-fees",
    investmentPurchase: "investment-purchases",
    miscellaneous: "miscellaneous",
} as const;

for (const kind of branchExpenseKinds) {
    const routes = Router();
    routes.use((_req, res, next) => {
        res.locals.expenseKind = kind;
        next();
    });
    routes.get(
        "/",
        authenticate,
        validateQuery(branchExpenseListQuery),
        asyncHandler(branchExpenseController.list),
    );
    routes.post(
        "/",
        authenticate,
        requirePermission("branchExpenses.create"),
        validate(branchExpenseSchemas[kind]),
        asyncHandler(branchExpenseController.create),
    );
    routes.get("/:id", authenticate, asyncHandler(branchExpenseController.getById));
    routes.patch(
        "/:id",
        authenticate,
        requirePermission("branchExpenses.update"),
        validate(branchExpensePatchSchemas[kind]),
        asyncHandler(branchExpenseController.update),
    );
    routes.delete(
        "/:id",
        authenticate,
        requirePermission("branchExpenses.delete"),
        asyncHandler(branchExpenseController.remove),
    );
    router.use(`/${routeNames[kind]}`, routes);
}

export default router;
