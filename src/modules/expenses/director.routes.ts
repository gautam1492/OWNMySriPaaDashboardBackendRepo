import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as directorController from "./director.controller.js";
import { directorListQuery } from "./director.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validateQuery(directorListQuery),
    asyncHandler(directorController.list),
);
router.get("/:id", authenticate, asyncHandler(directorController.getById));

export default router;
