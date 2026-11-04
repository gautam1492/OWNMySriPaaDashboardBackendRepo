import { z } from "zod";
import { mobileNumberSchema } from "../../utils/mobile-number.js";

export const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
});

export const passwordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email().max(255),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(40).max(100),
        password: z.string().min(8).max(128),
        confirmPassword: z.string().min(8).max(128),
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "The passwords do not match.",
    });

export const profilePatchSchema = z
    .object({
        name: z.string().trim().min(2).max(160).optional(),
        mobileNumber: mobileNumberSchema,
    })
    .refine((value) => value.name !== undefined || value.mobileNumber !== undefined, {
        message: "Provide a name or mobile number to update.",
    });
