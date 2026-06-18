export function formatTimeRemaining(endsAt: string): string | null {
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) return null;

    const diffMs = end.getTime() - Date.now();
    if (diffMs <= 0) return "Süresi doldu";

    const totalMinutes = Math.floor(diffMs / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}g ${hours}s kaldı`;
    if (hours > 0) return `${hours}s ${minutes}dk kaldı`;
    return `${minutes}dk kaldı`;
}
