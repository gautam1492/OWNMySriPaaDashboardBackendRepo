import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authController from "./auth.controller.js";
import {
    forgotPasswordSchema,
    loginSchema,
    passwordSchema,
    profilePatchSchema,
    resetPasswordSchema,
} from "./auth.validator.js";

const router = Router();
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post(
    "/forgot-password",
    passwordResetLimiter,
    validate(forgotPasswordSchema),
    asyncHandler(authController.forgotPassword),
);
router.post(
    "/reset-password",
    passwordResetLimiter,
    validate(resetPasswordSchema),
    asyncHandler(authController.resetPassword),
);

// Refresh uses the HttpOnly cookie; no token is accepted in the request body.
router.post("/refresh", asyncHandler(authController.refresh));

// Logout also works when the access token has expired or is missing.
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));
router.get("/profile", authenticate, asyncHandler(authController.profile));
router.patch(
    "/profile",
    authenticate,
    validate(profilePatchSchema),
    asyncHandler(authController.updateProfile),
);
router.post(
    "/change-password",
    authenticate,
    validate(passwordSchema),
    asyncHandler(authController.changePassword),
);

export default router;
