const STORAGE_KEY = "ltz_deal_watchlist";

function normalize(gameTitle: string): string {
    return gameTitle.trim().toLowerCase();
}

function readTitles(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function getWatchlist(): string[] {
    return readTitles();
}

export function isWatched(gameTitle: string): boolean {
    return readTitles().includes(normalize(gameTitle));
}

export function toggleWatchlist(gameTitle: string): boolean {
    const key = normalize(gameTitle);
    const titles = readTitles();
    const next = titles.includes(key)
        ? titles.filter((title) => title !== key)
        : [...titles, key];
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // localStorage unavailable - change won't persist, still fine in-memory for this tab
    }
    return next.includes(key);
}
