import { z } from "zod";

/** The application stores Indian mobile numbers as exactly ten digits. */
export function isValidMobileNumber(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^\d{10}$/.test(trimmed);
}

export const mobileNumberSchema = z
    .string()
    .trim()
    .max(30, "Mobile number must be 30 characters or fewer.")
    .refine(isValidMobileNumber, {
        message: "Enter exactly 10 digits.",
    })
    .nullable()
    .optional();
