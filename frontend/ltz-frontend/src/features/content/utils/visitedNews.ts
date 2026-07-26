const STORAGE_KEY = "ltz_visited_news_ids";
const MAX_STORED = 500;

function readIds(): number[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function isNewsVisited(articleId: number): boolean {
    return readIds().includes(articleId);
}

export function markNewsVisited(articleId: number): void {
    try {
        const ids = readIds();
        if (ids.includes(articleId)) return;
        const next = [...ids, articleId].slice(-MAX_STORED);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // localStorage unavailable (private mode etc.) - silently skip
    }
}
