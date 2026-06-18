import { REVIEW_API_ENDPOINTS } from "../../../lib/constants";
import { apiClient } from "../../../lib/axios";
import type {
    CreateReviewRequest,
    GameSource,
    ReportReviewRequest,
    ReviewAverageRatingResponse,
    ReviewResponse,
} from "../types/review.types";

export const reviewService = {
    getGameReviews: (gameId: number | string) =>
        apiClient.get<ReviewResponse[]>(REVIEW_API_ENDPOINTS.gameReviews(gameId)),

    getExternalGameReviews: (
        gameSource: GameSource,
        externalGameId: number | string,
    ) =>
        apiClient.get<ReviewResponse[]>(
            REVIEW_API_ENDPOINTS.externalGameReviews(gameSource, externalGameId),
        ),

    getGameAverageRating: (gameId: number | string) =>
        apiClient.get<ReviewAverageRatingResponse>(
            REVIEW_API_ENDPOINTS.averageRating(gameId),
        ),

    getExternalGameAverageRating: (
        gameSource: GameSource,
        externalGameId: number | string,
    ) =>
        apiClient.get<ReviewAverageRatingResponse>(
            REVIEW_API_ENDPOINTS.externalAverageRating(gameSource, externalGameId),
        ),

    getTopGameReviews: (gameId: number | string) =>
        apiClient.get<ReviewResponse[]>(REVIEW_API_ENDPOINTS.topReviews(gameId)),

    getTopExternalGameReviews: (
        gameSource: GameSource,
        externalGameId: number | string,
    ) =>
        apiClient.get<ReviewResponse[]>(
            REVIEW_API_ENDPOINTS.externalTopReviews(gameSource, externalGameId),
        ),

    createReview: (request: CreateReviewRequest) =>
        apiClient.post<ReviewResponse, CreateReviewRequest>(
            REVIEW_API_ENDPOINTS.reviews,
            request,
        ),

    likeReview: (reviewId: number | string) =>
        apiClient.post<ReviewResponse>(REVIEW_API_ENDPOINTS.likeReview(reviewId)),

    unlikeReview: (reviewId: number | string) =>
        apiClient.delete(REVIEW_API_ENDPOINTS.likeReview(reviewId)),

    reportReview: (reviewId: number | string, request: ReportReviewRequest) =>
        apiClient.post<void, ReportReviewRequest>(
            REVIEW_API_ENDPOINTS.reportReview(reviewId),
            request,
        ),
};