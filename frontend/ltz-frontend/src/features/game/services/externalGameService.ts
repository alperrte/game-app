import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type {
    ExternalGameCategory,
    ExternalGameDetailResponse,
    ExternalGamePageResponse,
    ExternalGamePlatform,
    ExternalGameSearchResponse,
    ExternalGameTag,
    GameSource,
} from "../types/externalGame.types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
    expiresAt: number;
    value: T;
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const buildCacheKey = (
    endpoint: string,
    params: Record<string, string | undefined> = {}
) => {
    const normalizedParams = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}:${value}`)
        .join("|");

    return normalizedParams ? `${endpoint}?${normalizedParams}` : endpoint;
};

const getCachedExternalData = async <T>(
    key: string,
    request: () => Promise<T>
): Promise<T> => {
    const cachedValue = responseCache.get(key);
    const now = Date.now();

    if (cachedValue && cachedValue.expiresAt > now) {
        return cachedValue.value as T;
    }

    const pendingRequest = pendingRequests.get(key);

    if (pendingRequest) {
        return pendingRequest as Promise<T>;
    }

    const nextRequest = request()
        .then((value) => {
            responseCache.set(key, {
                expiresAt: Date.now() + CACHE_TTL_MS,
                value,
            });

            return value;
        })
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, nextRequest);

    return nextRequest;
};

export function searchExternalGames(
    source: GameSource,
    query: string
): Promise<ExternalGameSearchResponse[]> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalGameSearch, { source, query }),
        () =>
            apiClient.get<ExternalGameSearchResponse[]>(
                GAME_API_ENDPOINTS.externalGameSearch,
                { source, query }
            )
    );
}

export function getExternalAppsPage(
    source: GameSource,
    page: number,
    size: number
): Promise<ExternalGamePageResponse> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalApps, {
            page: String(page),
            size: String(size),
            source,
        }),
        () =>
            apiClient.get<ExternalGamePageResponse>(GAME_API_ENDPOINTS.externalApps, {
                source,
                page,
                size,
            })
    );
}

export function getExternalGameDetail(
    source: GameSource,
    externalId: string
): Promise<ExternalGameDetailResponse> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalGameDetail, {
            externalId,
            source,
        }),
        () =>
            apiClient.get<ExternalGameDetailResponse>(
                GAME_API_ENDPOINTS.externalGameDetail,
                { source, externalId }
            )
    );
}

export function getExternalGameCategories(
    source: GameSource,
    query?: string
): Promise<ExternalGameCategory[]> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalGameCategories, {
            query,
            source,
        }),
        () =>
            apiClient.get<ExternalGameCategory[]>(
                GAME_API_ENDPOINTS.externalGameCategories,
                { source, query }
            )
    );
}

export function getExternalGameTags(
    source: GameSource
): Promise<ExternalGameTag[]> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalGameTags, { source }),
        () =>
            apiClient.get<ExternalGameTag[]>(GAME_API_ENDPOINTS.externalGameTags, {
                source,
            })
    );
}

export function getExternalGamePlatforms(): Promise<ExternalGamePlatform[]> {
    return getCachedExternalData(
        buildCacheKey(GAME_API_ENDPOINTS.externalGamePlatforms),
        () =>
            apiClient.get<ExternalGamePlatform[]>(
                GAME_API_ENDPOINTS.externalGamePlatforms
            )
    );
}
