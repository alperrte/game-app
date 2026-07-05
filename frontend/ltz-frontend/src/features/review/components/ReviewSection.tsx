import { useCallback, useEffect, useMemo, useState } from "react";

import { USER_API_ENDPOINTS } from "../../../lib/constants";
import { apiClient } from "../../../lib/axios";
import { useAuthStore } from "../../../store/authStore";
import { reviewService } from "../services/reviewService";
import type {
    CreateReviewRequest,
    GameSource,
    ReviewFormValues,
    ReviewResponse,
} from "../types/review.types";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ReviewReportModal } from "./ReviewReportModal";

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

type UserProfileSummary = {
    id?: number | string;
    userId?: number | string;
    username?: string | null;
    displayName?: string | null;
    fullName?: string | null;
    name?: string | null;
};

function getErrorStatus(error: unknown) {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }

    const apiError = error as ApiErrorLike;

    return apiError.status ?? apiError.response?.status;
}

function getProfileDisplayName(profile: UserProfileSummary) {
    return (
        profile.displayName?.trim() ||
        profile.username?.trim() ||
        profile.fullName?.trim() ||
        profile.name?.trim() ||
        null
    );
}

function toNullableText(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function toNullableNumber(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

export function ReviewSection({
                                  gameSource = "INTERNAL",
                                  gameId = null,
                                  externalGameId = null,
                              }: ReviewSectionProps) {
    const { user, isAuthenticated } = useAuthStore();

    const currentUserId = user?.userId ?? null;

    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(
        null,
    );

    const [authorNamesByUserId, setAuthorNamesByUserId] = useState<
        Record<number, string>
    >({});

    const [likedReviewIds, setLikedReviewIds] = useState<Set<number>>(
        () => new Set(),
    );

    const [selectedReportReview, setSelectedReportReview] =
        useState<ReviewResponse | null>(null);

    const [selectedDeleteReview, setSelectedDeleteReview] =
        useState<ReviewResponse | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(
        null,
    );

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

    const refreshReviews = useCallback(async () => {
        await loadReviews();
    }, [loadReviews]);

    useEffect(() => {
        void refreshReviews();
    }, [refreshReviews]);

    useEffect(() => {
        const uniqueUserIds = Array.from(
            new Set(reviews.map((review) => review.userId)),
        ).filter((userId) => authorNamesByUserId[userId] === undefined);

        if (uniqueUserIds.length === 0) {
            return;
        }

        let active = true;

        const loadAuthorNames = async () => {
            const entries = await Promise.all(
                uniqueUserIds.map(async (userId) => {
                    try {
                        const profile = await apiClient.get<UserProfileSummary>(
                            USER_API_ENDPOINTS.profileById(userId),
                        );

                        const displayName = getProfileDisplayName(profile);

                        return [userId, displayName ?? `User #${userId}`] as const;
                    } catch {
                        return [userId, `User #${userId}`] as const;
                    }
                }),
            );

            if (!active) {
                return;
            }

            setAuthorNamesByUserId((currentNames) => {
                const nextNames = { ...currentNames };

                entries.forEach(([userId, displayName]) => {
                    nextNames[userId] = displayName;
                });

                return nextNames;
            });
        };

        void loadAuthorNames();

        return () => {
            active = false;
        };
    }, [authorNamesByUserId, reviews]);

    const handleOpenDeleteConfirm = (review: ReviewResponse) => {
        setErrorMessage(null);
        setSelectedDeleteReview(review);
    };

    const handleCloseDeleteConfirm = () => {
        setSelectedDeleteReview(null);
    };

    const handleConfirmDeleteReview = async () => {
        if (!selectedDeleteReview) {
            return;
        }

        setActionLoading(true);
        setErrorMessage(null);

        try {
            await reviewService.deleteReview(selectedDeleteReview.id);

            setLikedReviewIds((currentIds) => {
                const nextIds = new Set(currentIds);
                nextIds.delete(selectedDeleteReview.id);
                return nextIds;
            });

            setSelectedDeleteReview(null);
            await refreshReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 401 || status === 403) {
                setErrorMessage("Bu incelemeyi silme yetkin yok.");
                return;
            }

            if (status === 404) {
                setErrorMessage("Silmek istediğin inceleme bulunamadı.");
                return;
            }

            setErrorMessage("İnceleme silinirken bir sorun oluştu.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleLikeReview = async (review: ReviewResponse) => {
        setActionLoading(true);
        setErrorMessage(null);

        const likedByCurrentUser = likedReviewIds.has(review.id);

        try {
            if (likedByCurrentUser) {
                await reviewService.unlikeReview(review.id);

                setLikedReviewIds((currentIds) => {
                    const nextIds = new Set(currentIds);
                    nextIds.delete(review.id);
                    return nextIds;
                });
            } else {
                await reviewService.likeReview(review.id);

                setLikedReviewIds((currentIds) => {
                    const nextIds = new Set(currentIds);
                    nextIds.add(review.id);
                    return nextIds;
                });
            }

            await loadReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 409 && !likedByCurrentUser) {
                try {
                    await reviewService.unlikeReview(review.id);

                    setLikedReviewIds((currentIds) => {
                        const nextIds = new Set(currentIds);
                        nextIds.delete(review.id);
                        return nextIds;
                    });

                    await loadReviews();
                    return;
                } catch {
                    setErrorMessage("Beğeni geri alınırken bir sorun oluştu.");
                    return;
                }
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

    const openReviewForm = () => {
        setCreateErrorMessage(null);
        setShowForm(true);
    };

    const handleCreateReview = async (values: ReviewFormValues) => {
        setCreating(true);
        setCreateErrorMessage(null);

        const commonFields = {
            rating: values.rating,
            reviewText: values.reviewText.trim(),
            graphicsReview: toNullableText(values.graphicsReview),
            gameplayReview: toNullableText(values.gameplayReview),
            storyReview: toNullableText(values.storyReview),
            performanceReview: toNullableText(values.performanceReview),
            pros: toNullableText(values.pros),
            cons: toNullableText(values.cons),
            recommended: values.recommended,
            playtimeHours: toNullableNumber(values.playtimeHours),
            playtimeMinutes: toNullableNumber(values.playtimeMinutes),
            platform: toNullableText(values.platform),
            hardwareInfo: toNullableText(values.hardwareInfo),
        };

        const request: CreateReviewRequest = isExternalGame
            ? {
                gameSource: normalizedGameSource,
                gameId: null,
                externalGameId: String(externalGameId),
                ...commonFields,
            }
            : {
                gameSource: normalizedGameSource,
                gameId: Number(gameId),
                externalGameId: null,
                ...commonFields,
            };

        try {
            await reviewService.createReview(request);
            setShowForm(false);
            await refreshReviews();
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 409) {
                setCreateErrorMessage("Bu oyun için zaten inceleme oluşturdun.");
                return;
            }

            if (status === 401 || status === 403) {
                setCreateErrorMessage("İnceleme yazmak için giriş yapmalısın.");
                return;
            }

            setCreateErrorMessage("İncelemen oluşturulurken bir sorun oluştu.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="mt-10 space-y-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-300">
                    Oyuncu yorumları
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                    Topluluk İncelemeleri
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Oyuncuların bu oyun hakkındaki deneyimlerini, puanlarını ve
                    yorumlarını keşfet.
                </p>
            </div>

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

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {reviews.length} inceleme
                        </span>

                        {isAuthenticated && !showForm && sortedReviews.length > 0 ? (
                            <button
                                type="button"
                                onClick={openReviewForm}
                                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                            >
                                İnceleme Yaz
                            </button>
                        ) : null}
                    </div>
                </div>

                {showForm ? (
                    <ReviewForm
                        submitting={creating}
                        errorMessage={createErrorMessage}
                        onSubmit={handleCreateReview}
                    />
                ) : null}

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
                                authorName={authorNamesByUserId[review.userId]}
                                likedByCurrentUser={likedReviewIds.has(review.id)}
                                canDelete={
                                    currentUserId !== null && review.userId === currentUserId
                                }
                                onToggleLike={handleToggleLikeReview}
                                onDelete={handleOpenDeleteConfirm}
                                onReport={handleOpenReportModal}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h4 className="text-base font-semibold text-slate-950 dark:text-white">
                            Henüz bu oyun için inceleme yazılmamış.
                        </h4>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Bu oyun hakkında deneyimini paylaşan ilk oyunculardan biri
                            ol. Görüşlerin diğer oyuncuların karar vermesine yardımcı
                            olabilir.
                        </p>

                        {isAuthenticated && !showForm ? (
                            <button
                                type="button"
                                onClick={openReviewForm}
                                className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                            >
                                İlk İncelemeyi Yaz
                            </button>
                        ) : null}
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

            {selectedDeleteReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                            İncelemeyi sil
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Bu incelemeyi silmek istediğine emin misin? Bu işlem geri
                            alınamaz.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleCloseDeleteConfirm}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmDeleteReview}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {actionLoading ? "Siliniyor..." : "Evet, sil"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}