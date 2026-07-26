import { apiClient } from "../../../lib/axios";
import { CONTENT_API_ENDPOINTS } from "../../../lib/constants";
import type { ContentStatsResponse } from "../types/contentStats.types";
import type { DealCampaign, DealCompareItem } from "../types/deals.types";
import type { EsportMatch, EsportMatchStatus } from "../types/esport.types";
import type { GamingHistoryEvent } from "../types/history.types";
import type { NewsArticle, NewsCategory } from "../types/news.types";
import type { SpringPage } from "../types/pagination.types";
import type {
    ReactionContentType,
    ReactionRequestBody,
    ReactionType,
} from "../types/reactions.types";
import type { SpotlightBanner } from "../types/spotlight.types";
import type {
    TodayTriviaResponse,
    TriviaSubmitResponse,
} from "../types/trivia.types";

export const contentService = {
    getStats: () =>
        apiClient.get<ContentStatsResponse>(CONTENT_API_ENDPOINTS.stats),

    getEsportMatches: (status?: EsportMatchStatus) =>
        apiClient.get<EsportMatch[]>(CONTENT_API_ENDPOINTS.esports, {
            ...(status ? { status } : {}),
        }),

    getDeals: (params: { page?: number; size?: number; minDiscount?: number }) =>
        apiClient.get<SpringPage<DealCampaign>>(CONTENT_API_ENDPOINTS.deals, {
            page: params.page ?? 0,
            size: params.size ?? 20,
            ...(params.minDiscount ? { minDiscount: params.minDiscount } : {}),
        }),

    searchDeals: (title?: string) =>
        apiClient.get<DealCompareItem[]>(CONTENT_API_ENDPOINTS.dealsSearch, {
            ...(title?.trim() ? { title: title.trim() } : {}),
        }),

    getFreeGames: () =>
        apiClient.get<DealCampaign[]>(CONTENT_API_ENDPOINTS.freeGames),

    getNews: (params: {
        page?: number;
        size?: number;
        category?: NewsCategory;
        source?: string;
    }) =>
        apiClient.get<SpringPage<NewsArticle>>(CONTENT_API_ENDPOINTS.news, {
            page: params.page ?? 0,
            size: params.size ?? 12,
            ...(params.category ? { category: params.category } : {}),
            ...(params.source ? { source: params.source } : {}),
        }),

    getNewsSources: () =>
        apiClient.get<string[]>(CONTENT_API_ENDPOINTS.newsSources),

    getNewsById: (id: number) =>
        apiClient.get<NewsArticle>(CONTENT_API_ENDPOINTS.newsById(id)),

    reactToContent: (body: ReactionRequestBody) =>
        apiClient.post<{ message: string }, ReactionRequestBody>(
            CONTENT_API_ENDPOINTS.reactions,
            body,
        ),

    removeReaction: (contentId: number, contentType: ReactionContentType) =>
        apiClient.delete(CONTENT_API_ENDPOINTS.reactions, {
            contentId,
            contentType,
        }),

    getTodayTrivia: () =>
        apiClient.get<TodayTriviaResponse>(CONTENT_API_ENDPOINTS.triviaToday),

    submitTriviaAnswer: (selectedIndex: number) =>
        apiClient.post<TriviaSubmitResponse, Record<string, never>>(
            `${CONTENT_API_ENDPOINTS.triviaSubmit}?selectedIndex=${selectedIndex}`,
            {},
        ),

    getTodayHistory: () =>
        apiClient.get<GamingHistoryEvent[]>(CONTENT_API_ENDPOINTS.historyToday),

    getHistoryByDate: (month: number, day: number) =>
        apiClient.get<GamingHistoryEvent[]>(
            CONTENT_API_ENDPOINTS.historyByDate,
            { month, day },
        ),

    getSpotlightBanners: () =>
        apiClient.get<SpotlightBanner[]>(CONTENT_API_ENDPOINTS.spotlight),
};

export type { ReactionType, ReactionContentType };
