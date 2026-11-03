import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/authorization.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as branchController from "./branch.controller.js";
import { createBranchSchema } from "./branch.validator.js";

const router = Router();

router.get("/", authenticate, asyncHandler(branchController.list));
router.post(
    "/",
    authenticate,
    requirePermission("branches.create"),
    validate(createBranchSchema),
    asyncHandler(branchController.create),
);
router.delete(
    "/:id",
    authenticate,
    requirePermission("branches.delete"),
    asyncHandler(branchController.remove),
);

export default router;
