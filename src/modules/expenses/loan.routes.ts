import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as loanController from "./loan.controller.js";
import { loanListQuery, loanSchema, loanPatchSchema } from "./loan.validator.js";

const router = Router();

router.get("/", authenticate, validateQuery(loanListQuery), asyncHandler(loanController.list));
router.post(
    "/",
    authenticate,
    requirePermission("loans.create"),
    validate(loanSchema),
    asyncHandler(loanController.create),
);
router.get("/:id", authenticate, asyncHandler(loanController.getById));
router.patch(
    "/:id",
    authenticate,
    requirePermission("loans.update"),
    validate(loanPatchSchema),
    asyncHandler(loanController.update),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("loans.delete"),
    asyncHandler(loanController.remove),
);

export default router;
