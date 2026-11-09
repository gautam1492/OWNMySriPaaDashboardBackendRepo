import { z } from "zod";
import { env } from "../config/env.js";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

function businessToday(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: env.BUSINESS_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

/** Date schema for records entered by users; date-range query filters should keep using dateString. */
export const nonFutureDateString = dateString
    .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, "Enter a valid calendar date.")
    .refine((value) => value <= businessToday(), "Date cannot be in the future.");

export function asDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
}

export function dateRange(period?: string, startDate?: string, endDate?: string) {
    if (startDate || endDate) {
        if (!startDate || !endDate) throw new Error("Both startDate and endDate are required");
        const start = asDate(startDate);
        const end = asDate(endDate);
        if (start > end) throw new Error("startDate must be before or equal to endDate");
        return { start, end };
    }
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(end);
    switch (period) {
        case "weekly":
            start.setUTCDate(start.getUTCDate() - 6);
            break;
        case "monthly":
            start.setUTCDate(1);
            break;
        case "yearly":
            start.setUTCMonth(0, 1);
            break;
        case "daily":
        default:
            break;
    }
    return { start, end };
}

export function endExclusive(end: Date): Date {
    const exclusive = new Date(end);
    exclusive.setUTCDate(exclusive.getUTCDate() + 1);
    return exclusive;
}
