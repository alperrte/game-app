/**
 * Optimizes image URLs from Steam and IGDB to load high-resolution versions.
 */
export function optimizeImageUrl(url: string | null | undefined): string {
    if (!url) return "";

    // Microsoft Store Images (often broken or restricted on third-party domains, returning 404)
    if (url.includes("store-images.s-microsoft.com")) {
        // Return empty string to force instant fallback to our stylized text placeholders
        // and avoid triggering browser console 404 errors.
        return "";
    }

    // Steam CDN Images (CheapShark / Steam direct)
    if (url.includes("steamstatic") || url.includes("steamcdn") || url.includes("/steam/apps/")) {
        // Extract the App ID from the URL (e.g., /apps/2014550/)
        const appIdMatch = url.match(/\/apps\/(\d+)/i);
        if (appIdMatch && appIdMatch[1]) {
            const appId = appIdMatch[1];
            // By using the direct AppID path without the hash, we can safely request capsule_616x353.jpg
            return `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_616x353.jpg`;
        }
    }

    // IGDB CDN Images
    if (url.includes("images.igdb.com")) {
        // Replace small cover/thumbnail sizes with t_720p (1280x720 pixels)
        return url.replace(/\/t_(?:thumb|cover_small|cover_big)\//gi, "/t_720p/");
    }

    return url;
}
