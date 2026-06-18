import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "../../../store/authStore";
import { reviewService } from "../services/reviewService";
import type {
    CreateReviewRequest,
    ReviewAverageRatingResponse,
    ReviewFormValues,
    ReviewResponse,
} from "../types/review.types";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ReviewRatingSummary } from "./ReviewRatingSummary";
import { ReviewReportModal } from "./ReviewReportModal";

type GameSource = "INTERNAL" | "STEAM" | "EPIC";

type ReviewSectionProps = {
    gameSource?: GameSource;
    gameId?: number | null;
    externalGameId?: string | null;
};

type ApiErrorLike = {
    status?: number;
    response?: {
        status?: number;
    };
    message?: string;
};

function getErrorStatus(error: unknown) {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }

    const apiError = error as ApiErrorLike;

    return apiError.status ?? apiError.response?.status;
}

function toNullableText(value: string) {
    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function toNullableNumber(value: string) {
    if (!value.trim()) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isNaN(parsedValue) ? null : parsedValue;
}

export function ReviewSection({
                                  gameSource = "INTERNAL",
                                  gameId = null,
                                  externalGameId = null,
                              }: ReviewSectionProps) {
    const { isAuthenticated } = useAuthStore();

    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [averageRating, setAverageRating] =
        useState<ReviewAverageRatingResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
    const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(
        null,
    );

    const [selectedReportReview, setSelectedReportReview] =
        useState<ReviewResponse | null>(null);

    const normalizedGameSource = gameSource.toUpperCase() as GameSource;
    const isExternalGame = normalizedGameSource !== "INTERNAL";

    const hasValidReviewReference = isExternalGame
        ? Boolean(externalGameId)
        : gameId !== null && gameId !== undefined;

    const sortedReviews = useMemo(
        () =>
            [...reviews].sort(
                (firstReview, secondReview) =>
                    new Date(secondReview.createdAt).getTime() -
                    new Date(firstReview.createdAt).getTime(),
            ),
        [reviews],
    );

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        if (!hasValidReviewReference) {
            setReviews([]);
            setErrorMessage("Bu oyun için inceleme referansı bulunamadı.");
            setLoading(false);
            return;
        }

        try {
            const data = isExternalGame
                ? await reviewService.getExternalGameReviews(
                    normalizedGameSource,
                    String(externalGameId),
                )
                : await reviewService.getGameReviews(Number(gameId));

            setReviews(data);
        } catch {
            setErrorMessage("İncelemeler yüklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    }, [
        externalGameId,
        gameId,
        hasValidReviewReference,
        isExternalGame,
        normalizedGameSource,
    ]);

    const loadAverageRating = useCallback(async () => {
        setSummaryLoading(true);

        if (!hasValidReviewReference) {
            setAverageRating(null);
            setSummaryLoading(false);
            return;
        }

        try {
            const data = isExternalGame
                ? await reviewService.getExternalGameAverageRating(
                    normalizedGameSource,
                    String(externalGameId),
                )
                : await reviewService.getGameAverageRating(Number(gameId));

            setAverageRating(data);
        } catch {
            setAverageRating(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [
        externalGameId,
        gameId,
        hasValidReviewReference,
        isExternalGame,
        normalizedGameSource,
    ]);

    const refreshReviews = useCallback(async () => {
        await Promise.all([loadReviews(), loadAverageRating()]);
    }, [loadReviews, loadAverageRating]);

    useEffect(() => {
        void refreshReviews();
    }, [refreshReviews]);

    const handleCreateReview = async (values: ReviewFormValues) => {
        setSubmitting(true);
        setFormErrorMessage(null);

        if (!hasValidReviewReference) {
            setFormErrorMessage("Bu oyun için inceleme referansı bulunamadı.");
            setSubmitting(false);
            return;
        }

        const request: CreateReviewRequest = {
            gameSource: normalizedGameSource,
            gameId: isExternalGame ? null : Number(gameId),
            externalGameId: isExternalGame ? String(externalGameId) : null,
            rating: values.rating,
            reviewText: values.reviewText.trim(),
            recommended: values.recommended,
            playtimeHours: toNullableNumber(values.playtimeHours),
            platform: toNullableText(values.platform),
            hardwareInfo: toNullableText(values.hardwareInfo),
        };

        try {
            await reviewService.createReview(request);
            await refreshReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 409) {
                setFormErrorMessage("Bu oyun için zaten inceleme oluşturdun.");
                return;
            }

            if (status === 401 || status === 403) {
                setFormErrorMessage("İnceleme yazmak için giriş yapmalısın.");
                return;
            }

            setFormErrorMessage("İnceleme gönderilirken bir sorun oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeReview = async (reviewId: number) => {
        setActionLoading(true);

        try {
            await reviewService.likeReview(reviewId);
            await loadReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 409) {
                setErrorMessage("Bu incelemeyi zaten beğendin.");
                return;
            }

            if (status === 401 || status === 403) {
                setErrorMessage("Beğenmek için giriş yapmalısın.");
                return;
            }

            setErrorMessage("Beğeni işlemi sırasında bir sorun oluştu.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenReportModal = (review: ReviewResponse) => {
        setReportErrorMessage(null);
        setSelectedReportReview(review);
    };

    const handleCloseReportModal = () => {
        setReportErrorMessage(null);
        setSelectedReportReview(null);
    };

    const handleReportReview = async (reason: string) => {
        if (!selectedReportReview) {
            return;
        }

        setReportSubmitting(true);
        setReportErrorMessage(null);

        try {
            await reviewService.reportReview(selectedReportReview.id, { reason });
            setSelectedReportReview(null);
            await loadReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 401 || status === 403) {
                setReportErrorMessage("Şikayet etmek için giriş yapmalısın.");
                return;
            }

            if (status === 409) {
                setReportErrorMessage(
                    "Bu incelemeyi daha önce şikayet etmiş olabilirsin.",
                );
                return;
            }

            setReportErrorMessage("Şikayet gönderilirken bir sorun oluştu.");
        } finally {
            setReportSubmitting(false);
        }
    };

    return (
        <section className="mt-10 space-y-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-300">
                    Oyuncu yorumları
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                    İncelemeler
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Oyuncuların deneyimlerini, puanlarını ve tavsiye durumlarını buradan
                    inceleyebilirsin.
                </p>
            </div>

            <ReviewRatingSummary
                averageRating={averageRating}
                loading={summaryLoading}
            />

            {isAuthenticated ? (
                <ReviewForm
                    submitting={submitting}
                    errorMessage={formErrorMessage}
                    onSubmit={handleCreateReview}
                />
            ) : (
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 text-sm text-purple-800 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-100">
                    İnceleme yazmak, beğenmek veya şikayet etmek için giriş yapmalısın.
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                        Tüm incelemeler
                    </h3>

                    <span className="text-sm text-slate-500 dark:text-slate-400">
            {reviews.length} inceleme
          </span>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        İncelemeler yükleniyor...
                    </div>
                ) : sortedReviews.length > 0 ? (
                    <div className="space-y-4">
                        {sortedReviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                isAuthenticated={isAuthenticated}
                                actionLoading={actionLoading}
                                onLike={handleLikeReview}
                                onReport={handleOpenReportModal}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h4 className="text-base font-semibold text-slate-950 dark:text-white">
                            Henüz inceleme yok
                        </h4>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Bu oyun için ilk incelemeyi yazan oyuncu sen olabilirsin.
                        </p>
                    </div>
                )}
            </div>

            <ReviewReportModal
                open={selectedReportReview !== null}
                submitting={reportSubmitting}
                errorMessage={reportErrorMessage}
                onClose={handleCloseReportModal}
                onSubmit={handleReportReview}
            />
        </section>
    );
}