import type { ReviewResponse } from "../types/review.types";

type ReviewCardProps = {
    review: ReviewResponse;
    isAuthenticated: boolean;
    actionLoading?: boolean;
    authorName?: string;
    likedByCurrentUser?: boolean;
    canDelete?: boolean;
    onToggleLike: (review: ReviewResponse) => Promise<void>;
    onDelete: (review: ReviewResponse) => Promise<void>;
    onReport: (review: ReviewResponse) => void;
};

type DetailReviewBlock = {
    title: string;
    value: string | null;
};

function formatReviewDate(value: string) {
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatPlaytime(hours: number | null, minutes: number | null) {
    const safeHours = hours ?? 0;
    const safeMinutes = minutes ?? 0;

    if (safeHours === 0 && safeMinutes === 0) {
        return "Belirtilmedi";
    }

    if (safeHours >= 300) {
        return "300+ saat";
    }

    const parts: string[] = [];

    if (safeHours > 0) {
        parts.push(`${safeHours} saat`);
    }

    if (safeMinutes > 0) {
        parts.push(`${safeMinutes} dakika`);
    }

    return parts.join(" ");
}

function hasText(value: string | null) {
    return Boolean(value?.trim());
}

export function ReviewCard({
                               review,
                               isAuthenticated,
                               actionLoading = false,
                               authorName,
                               likedByCurrentUser = false,
                               canDelete = false,
                               onToggleLike,
                               onDelete,
                               onReport,
                           }: ReviewCardProps) {
    const displayName = authorName?.trim() || `User #${review.userId}`;
    const playtimeText = formatPlaytime(
        review.playtimeHours,
        review.playtimeMinutes,
    );

    const detailBlocks: DetailReviewBlock[] = [
        {
            title: "Grafikler",
            value: review.graphicsReview,
        },
        {
            title: "Oynanış",
            value: review.gameplayReview,
        },
        {
            title: "Hikaye",
            value: review.storyReview,
        },
        {
            title: "Performans / Optimizasyon",
            value: review.performanceReview,
        },
        {
            title: "Artılar",
            value: review.pros,
        },
        {
            title: "Eksiler",
            value: review.cons,
        },
    ].filter((block) => hasText(block.value));

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-purple-900/70">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {displayName}
                        </span>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                review.recommended
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                    : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
                            }`}
                        >
                            {review.recommended ? "Tavsiye ediyor" : "Tavsiye etmiyor"}
                        </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {formatReviewDate(review.createdAt)}
                    </p>
                </div>

                <div className="flex items-end gap-1 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-950/40">
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-200">
                        {review.rating}
                    </span>
                    <span className="pb-0.5 text-sm font-semibold text-purple-500 dark:text-purple-300">
                        /10
                    </span>
                </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                {review.reviewText}
            </p>

            {detailBlocks.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {detailBlocks.map((block) => (
                        <section
                            key={block.title}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                                {block.title}
                            </h4>

                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {block.value}
                            </p>
                        </section>
                    ))}
                </div>
            )}

            <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                        Platform
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {review.platform || "Belirtilmedi"}
                    </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                        Oynama süresi
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {playtimeText}
                    </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">
                        Donanım
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {review.hardwareInfo || "Belirtilmedi"}
                    </span>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    disabled={!isAuthenticated || actionLoading}
                    onClick={() => onToggleLike(review)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        likedByCurrentUser
                            ? "border-purple-400 bg-purple-600 text-white hover:bg-purple-700 dark:border-purple-500 dark:bg-purple-700 dark:text-white dark:hover:bg-purple-600"
                            : "border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-purple-900 dark:hover:bg-purple-950/40 dark:hover:text-purple-200"
                    }`}
                >
                    {likedByCurrentUser ? "Beğenildi" : "Beğen"} · {review.likeCount}
                </button>

                <button
                    type="button"
                    disabled={!isAuthenticated || actionLoading}
                    onClick={() => onReport(review)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-200"
                >
                    Şikayet et
                </button>

                {canDelete && (
                    <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onDelete(review)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                        Sil
                    </button>
                )}

                {!isAuthenticated && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Beğenmek veya şikayet etmek için giriş yapmalısın.
                    </span>
                )}
            </div>
        </article>
    );
}