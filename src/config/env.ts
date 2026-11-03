import "dotenv/config";
import { z } from "zod";
import { resolveCookieSecure } from "./cookie-security.js";

const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        PORT: z.coerce.number().int().min(1).max(65535).default(5000),
        DATABASE_URL: z.string().min(1),
        JWT_ACCESS_SECRET: z.string().min(32),
        JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
        JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
        CORS_ORIGIN: z.string().default("http://localhost:5173"),
        FRONTEND_URL: z.string().url().default("http://localhost:5173"),
        SMTP_HOST: z.string().default("smtp.gmail.com"),
        SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
        SMTP_SECURE: z
            .enum(["true", "false"])
            .default("true")
            .transform((value) => value === "true"),
        SMTP_USER: z.string().optional(),
        SMTP_PASSWORD: z.string().optional(),
        SMTP_FROM: z.string().optional(),
        DAILY_DATA_REMINDER_TIME: z
            .string()
            .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
            .default("20:00"),
        BUSINESS_TIMEZONE: z.string().default("Asia/Kolkata"),
        COOKIE_SECURE: z.enum(["true", "false"]).optional(),
        COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
        LOG_LEVEL: z
            .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
            .default("info"),
    })
    .superRefine((values, context) => {
        const cookieSameSite =
            values.COOKIE_SAME_SITE ?? (values.NODE_ENV === "production" ? "none" : "lax");
        if (
            values.NODE_ENV === "production" &&
            !resolveCookieSecure(values.NODE_ENV, values.COOKIE_SECURE)
        ) {
            context.addIssue({
                code: "custom",
                path: ["COOKIE_SECURE"],
                message: "Secure authentication cookies are required in production.",
            });
        }
        if (
            cookieSameSite === "none" &&
            !resolveCookieSecure(values.NODE_ENV, values.COOKIE_SECURE)
        ) {
            context.addIssue({
                code: "custom",
                path: ["COOKIE_SAME_SITE"],
                message: "SameSite=None cookies require COOKIE_SECURE=true.",
            });
        }
        const frontendUrl = new URL(values.FRONTEND_URL);
        if (!["http:", "https:"].includes(frontendUrl.protocol)) {
            context.addIssue({
                code: "custom",
                path: ["FRONTEND_URL"],
                message: "FRONTEND_URL must use HTTP or HTTPS.",
            });
        }
        try {
            new Intl.DateTimeFormat("en", { timeZone: values.BUSINESS_TIMEZONE });
        } catch {
            context.addIssue({
                code: "custom",
                path: ["BUSINESS_TIMEZONE"],
                message: "BUSINESS_TIMEZONE must be a valid IANA timezone.",
            });
        }
        const isLoopbackFrontend = ["localhost", "127.0.0.1", "[::1]"].includes(
            frontendUrl.hostname.toLowerCase(),
        );
        if (
            values.NODE_ENV === "production" &&
            frontendUrl.protocol !== "https:" &&
            !isLoopbackFrontend
        ) {
            context.addIssue({
                code: "custom",
                path: ["FRONTEND_URL"],
                message: "HTTPS frontend URLs are required in production for secure account links.",
            });
        }
        const configuredCorsOrigins = values.CORS_ORIGIN.split(",").map((origin) => origin.trim());
        if (
            values.NODE_ENV === "production" &&
            !configuredCorsOrigins.includes(frontendUrl.origin)
        ) {
            context.addIssue({
                code: "custom",
                path: ["CORS_ORIGIN"],
                message: "CORS_ORIGIN must include the exact production FRONTEND_URL origin.",
            });
        }
    })
    .transform((values) => ({
        ...values,
        COOKIE_SECURE: resolveCookieSecure(values.NODE_ENV, values.COOKIE_SECURE),
        COOKIE_SAME_SITE:
            values.COOKIE_SAME_SITE ?? (values.NODE_ENV === "production" ? "none" : "lax"),
    }));

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
