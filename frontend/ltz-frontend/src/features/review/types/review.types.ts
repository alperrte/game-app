export type GameSource = "INTERNAL" | "STEAM" | "EPIC";

export type ReviewResponse = {
    id: number;
    gameSource: GameSource;
    gameId: number | null;
    externalGameId: string | null;
    userId: number;
    rating: number;
    reviewText: string;
    graphicsReview: string | null;
    gameplayReview: string | null;
    storyReview: string | null;
    performanceReview: string | null;
    pros: string | null;
    cons: string | null;
    recommended: boolean;
    playtimeHours: number | null;
    playtimeMinutes: number | null;
    platform: string | null;
    hardwareInfo: string | null;
    likeCount: number;
    reportCount: number;
    createdAt: string;
    updatedAt: string | null;
};

export type ReviewAverageRatingResponse = {
    gameId: number | null;
    averageRating: number;
    reviewCount: number;
};

export type CreateReviewRequest = {
    gameSource: GameSource;
    gameId: number | null;
    externalGameId: string | null;
    rating: number;
    reviewText: string;
    graphicsReview?: string | null;
    gameplayReview?: string | null;
    storyReview?: string | null;
    performanceReview?: string | null;
    pros?: string | null;
    cons?: string | null;
    recommended: boolean;
    playtimeHours?: number | null;
    playtimeMinutes?: number | null;
    platform?: string | null;
    hardwareInfo?: string | null;
};

export type ReportReviewRequest = {
    reason: string;
};

export type ReviewFormValues = {
    rating: number;
    reviewText: string;
    graphicsReview: string;
    gameplayReview: string;
    storyReview: string;
    performanceReview: string;
    pros: string;
    cons: string;
    recommended: boolean;
    playtimeHours: string;
    playtimeMinutes: string;
    platform: string;
    hardwareInfo: string;
};