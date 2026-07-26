const STORAGE_KEY = "ltz_bookmarked_news";
const MAX_STORED = 100;

export interface BookmarkedArticle {
    id: number;
    title: string;
    contentUrl: string;
    imageUrl?: string | null;
    sourceName: string;
    savedAt: string;
}

function readBookmarks(): BookmarkedArticle[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function getBookmarkedNews(): BookmarkedArticle[] {
    return readBookmarks();
}

export function isNewsBookmarked(articleId: number): boolean {
    return readBookmarks().some((a) => a.id === articleId);
}

export function toggleNewsBookmark(article: {
    id: number;
    title: string;
    contentUrl: string;
    imageUrl?: string | null;
    sourceName: string;
}): boolean {
    const bookmarks = readBookmarks();
    const exists = bookmarks.some((a) => a.id === article.id);

    const next = exists
        ? bookmarks.filter((a) => a.id !== article.id)
        : [
              {
                  id: article.id,
                  title: article.title,
                  contentUrl: article.contentUrl,
                  imageUrl: article.imageUrl,
                  sourceName: article.sourceName,
                  savedAt: new Date().toISOString(),
              },
              ...bookmarks,
          ].slice(0, MAX_STORED);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // localStorage unavailable - change stays in-memory for this render only
    }
    return !exists;
}
