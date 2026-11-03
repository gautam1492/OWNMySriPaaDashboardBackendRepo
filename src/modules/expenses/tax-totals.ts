export function calculateTaxTotals(price: number, gstPercentage: number, sgstPercentage: number) {
    const gstAmount = Math.round(((price * gstPercentage) / 100 + Number.EPSILON) * 100) / 100;
    const sgstAmount = Math.round(((price * sgstPercentage) / 100 + Number.EPSILON) * 100) / 100;
    const totalAmount = Math.round((price + gstAmount + sgstAmount + Number.EPSILON) * 100) / 100;

    return { gstAmount, sgstAmount, totalAmount };
}
