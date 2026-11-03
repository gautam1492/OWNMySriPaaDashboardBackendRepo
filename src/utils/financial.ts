import { DEFAULT_TAX_RATE } from "../constants/index.js";

export type Money = {
    subtotal: number;
    gstPercentage: number;
    gstAmount: number;
    sgstPercentage: number;
    sgstAmount: number;
    cgstPercentage: number;
    cgstAmount: number;
    totalAmount: number;
};

export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMedicineTotals(
    subtotal: number,
    gstPercentage = DEFAULT_TAX_RATE,
    sgstPercentage = DEFAULT_TAX_RATE,
    cgstPercentage = 0,
): Money {
    const safeSubtotal = roundMoney(subtotal);
    const gstAmount = roundMoney((safeSubtotal * gstPercentage) / 100);
    const sgstAmount = roundMoney((safeSubtotal * sgstPercentage) / 100);
    const cgstAmount = roundMoney((safeSubtotal * cgstPercentage) / 100);
    return {
        subtotal: safeSubtotal,
        gstPercentage,
        gstAmount,
        sgstPercentage,
        sgstAmount,
        cgstPercentage,
        cgstAmount,
        totalAmount: roundMoney(safeSubtotal + gstAmount + sgstAmount + cgstAmount),
    };
}

export function calculateServiceTotals(amount: number): Money {
    const subtotal = roundMoney(amount);
    return {
        subtotal,
        gstPercentage: 0,
        gstAmount: 0,
        sgstPercentage: 0,
        sgstAmount: 0,
        cgstPercentage: 0,
        cgstAmount: 0,
        totalAmount: subtotal,
    };
}

/** Course/card/expense totals: gross minus discount, no tax components. */
export function calculateGrossTotal(unitPrice: number, quantity: number, discount = 0): number {
    return roundMoney(roundMoney(unitPrice) * quantity - roundMoney(discount));
}

/** CSR amount = last-month income × percentage / 100. */
export function calculateCsrAmount(lastMonthTotalIncome: number, percentage: number): number {
    return roundMoney((roundMoney(lastMonthTotalIncome) * percentage) / 100);
}
