export type GameSource = "INTERNAL" | "STEAM" | "EPIC";

export type ReviewResponse = {
    id: number;
    gameSource: GameSource;
    gameId: number | null;
    externalGameId: string | null;
    userId: number;
    rating: number;
    reviewText: string;
    recommended: boolean;
    playtimeHours: number | null;
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
    recommended: boolean;
    playtimeHours?: number | null;
    platform?: string | null;
    hardwareInfo?: string | null;
};

export type ReportReviewRequest = {
    reason: string;
};

export type ReviewFormValues = {
    rating: number;
    reviewText: string;
    recommended: boolean;
    playtimeHours: string;
    platform: string;
    hardwareInfo: string;
};