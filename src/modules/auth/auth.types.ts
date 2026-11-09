import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { loginSchema, passwordSchema } from "./auth.validator.js";

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type { AuthUser, RequestMeta };

export type AuthTokens = {
    accessToken: string;
    /** ISO timestamp for when the access cookie expires (safe to expose; helps clients refresh proactively). */
    accessTokenExpiresAt: string;
    refreshToken: string;
    /** Absolute session expiry; refresh rotations cannot extend this limit. */
    refreshTokenExpiresAt: string;
    user: AuthUser;
    refreshTokenId: string;
};
