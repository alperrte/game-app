import type { NewsCategory } from "../types/news.types";

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
    GLOBAL: "Genel",
    HARDWARE: "Donanım",
    PATCH_NOTES: "Yama Notları",
};

export function formatNewsDate(
    value: string,
    monthStyle: "short" | "long" = "short",
): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: monthStyle,
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
