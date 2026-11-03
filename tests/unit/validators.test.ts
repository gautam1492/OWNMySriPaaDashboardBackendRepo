import { describe, expect, it } from "vitest";
import { saleSchema } from "../../src/modules/sales/sale.validator.js";
import { feedbackSchema } from "../../src/modules/feedback/feedback.validator.js";

describe("module validators", () => {
    it("accepts a sale submission with multiple individually priced items", () => {
        const parsed = saleSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            entryType: "OTC",
            items: [
                { itemId: "item-1", unitSold: 2, unitPrice: 500 },
                { itemId: "item-2", unitSold: 1, unitPrice: 250 },
            ],
        });
        expect(parsed.success).toBe(true);
    });

    it("rejects medicine sales without a line item", () => {
        const parsed = saleSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            entryType: "DOCTOR_PRESCRIBED_MEDICINE",
            items: [],
        });
        expect(parsed.success).toBe(false);
    });

    it("accepts a complete feedback payload with PATIENT_SELF", () => {
        const parsed = feedbackSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            doctor: "Dr A",
            service: "Consultation",
            patientType: "OPD",
            filledBy: "PATIENT_SELF",
            frontdeskRating: 5,
            posttreatmentRating: 4,
        });
        expect(parsed.success).toBe(true);
    });

    it("accepts a complete feedback payload with STAFF", () => {
        const parsed = feedbackSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            doctor: "Dr A",
            service: "Consultation",
            patientType: "OPD",
            filledBy: "STAFF",
            frontdeskRating: 3,
            posttreatmentRating: 3,
        });
        expect(parsed.success).toBe(true);
    });

    it("rejects SRIPAA_STAFF as filledBy (schema uses STAFF)", () => {
        const parsed = feedbackSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            doctor: "Dr A",
            service: "Consultation",
            patientType: "OPD",
            filledBy: "SRIPAA_STAFF",
            frontdeskRating: 3,
            posttreatmentRating: 3,
        });
        expect(parsed.success).toBe(false);
    });

    it("rejects feedback ratings below 1", () => {
        const parsed = feedbackSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            doctor: "Dr A",
            service: "Consultation",
            patientType: "OPD",
            filledBy: "PATIENT_SELF",
            frontdeskRating: 0,
            posttreatmentRating: 3,
        });
        expect(parsed.success).toBe(false);
    });

    it("rejects feedback ratings above 5", () => {
        const parsed = feedbackSchema.safeParse({
            date: "2026-09-24",
            branchId: "b1",
            doctor: "Dr A",
            service: "Consultation",
            patientType: "OPD",
            filledBy: "PATIENT_SELF",
            frontdeskRating: 6,
            posttreatmentRating: 3,
        });
        expect(parsed.success).toBe(false);
    });
});
