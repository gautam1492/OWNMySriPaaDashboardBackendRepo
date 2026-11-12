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
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
const sessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    keyGenerator: (req) => req.user!.id,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(authController.login));
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
router.post("/refresh", refreshLimiter, asyncHandler(authController.refresh));

// Logout also works when the access token has expired or is missing.
router.post("/logout", asyncHandler(authController.logout));
// Routine session/profile traffic has a separate, per-user budget.
router.use(authenticate, sessionLimiter);
router.get("/me", asyncHandler(authController.me));
router.get("/sessions", asyncHandler(authController.sessions));
router.post("/sessions/revoke-others", asyncHandler(authController.revokeOtherSessions));
router.post("/sessions/revoke-all", asyncHandler(authController.revokeAllSessions));
router.delete("/sessions/:sessionId", asyncHandler(authController.revokeSession));
router.get("/profile", asyncHandler(authController.profile));
router.patch("/profile", validate(profilePatchSchema), asyncHandler(authController.updateProfile));
router.post(
    "/change-password",
    validate(passwordSchema),
    asyncHandler(authController.changePassword),
);

export default router;
