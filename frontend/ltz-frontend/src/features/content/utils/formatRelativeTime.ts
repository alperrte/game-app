export function formatRelativeTime(value?: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < 1) return "az önce";
    if (diffMinutes < 60) return `${diffMinutes} dk önce`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} gün önce`;
}
