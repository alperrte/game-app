export function formatCompactNumber(value: number): string {
    return new Intl.NumberFormat("tr-TR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
