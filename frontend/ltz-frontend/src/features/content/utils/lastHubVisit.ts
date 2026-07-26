const STORAGE_KEY = "ltz_hub_last_visit";

export function getLastHubVisit(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setHubVisitNow(): void {
    try {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
        // localStorage unavailable - digest just won't persist across visits
    }
}
