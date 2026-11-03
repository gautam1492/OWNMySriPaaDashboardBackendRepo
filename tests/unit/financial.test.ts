import { describe, expect, it } from "vitest";
import {
    calculateCsrAmount,
    calculateGrossTotal,
    calculateMedicineTotals,
    calculateServiceTotals,
} from "../../src/utils/financial.js";

describe("financial rules", () => {
    it("calculates medicine GST and SGST from the backend subtotal", () => {
        expect(calculateMedicineTotals(1000)).toEqual({
            subtotal: 1000,
            gstPercentage: 2.5,
            gstAmount: 25,
            sgstPercentage: 2.5,
            sgstAmount: 25,
            cgstPercentage: 0,
            cgstAmount: 0,
            totalAmount: 1050,
        });
    });
    it("adds CGST when supplied", () => {
        expect(calculateMedicineTotals(1000, 2.5, 2.5, 1)).toMatchObject({
            cgstPercentage: 1,
            cgstAmount: 10,
            totalAmount: 1060,
        });
    });
    it("computes gross totals and CSR amounts", () => {
        expect(calculateGrossTotal(500, 3, 100)).toBe(1400);
        expect(calculateCsrAmount(200000, 2)).toBe(4000);
    });
    it("never applies GST to services", () => {
        expect(calculateServiceTotals(900)).toEqual({
            subtotal: 900,
            gstPercentage: 0,
            gstAmount: 0,
            sgstPercentage: 0,
            sgstAmount: 0,
            cgstPercentage: 0,
            cgstAmount: 0,
            totalAmount: 900,
        });
    });
});
