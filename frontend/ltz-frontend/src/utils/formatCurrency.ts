export function formatCurrency(
    value: number,
    currency = "USD",
    locale = "tr-TR",
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}
