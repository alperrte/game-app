import type { ReviewAverageRatingResponse } from "../types/review.types";

type ReviewRatingSummaryProps = {
    averageRating: ReviewAverageRatingResponse | null;
    loading?: boolean;
};

export function ReviewRatingSummary({
                                        averageRating,
                                        loading = false,
                                    }: ReviewRatingSummaryProps) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    İnceleme özeti yükleniyor...
                </p>
            </div>
        );
    }

    const ratingValue = averageRating?.averageRating ?? 0;
    const reviewCount = averageRating?.reviewCount ?? 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Oyuncu puanı
                    </p>

                    <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-950 dark:text-white">
              {ratingValue.toFixed(1)}
            </span>
                        <span className="pb-1 text-lg font-semibold text-slate-500 dark:text-slate-400">
              / 10
            </span>
                    </div>
                </div>

                <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-700 dark:bg-purple-950/40 dark:text-purple-200">
                    <span className="font-semibold">{reviewCount}</span>{" "}
                    inceleme üzerinden hesaplandı
                </div>
            </div>

            {reviewCount === 0 && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Bu oyun için henüz inceleme yok. İlk incelemeyi sen yazabilirsin.
                </p>
            )}
        </div>
    );
}