/*
 * Koşullu className birleştirme yardımcı fonksiyonu.
 * Falsy değerleri (false, undefined, null, "") atar ve geri kalanları birleştirir.
 *
 * Örnek:
 * cn("px-4", isActive && "bg-violet-600", error && "border-red-500")
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
    return classes.filter(Boolean).join(" ");
}
