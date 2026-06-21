import { useEffect, useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Clock, Gamepad2 } from "lucide-react";
import { userService } from "../../services/userService";
import type { ReviewClientResponse } from "../../types/user";
import { SectionPanel } from "./ProfilePrimitives";
import { formatProfileDate } from "../../utils/profileHelpers";

type ProfileReviewsSectionProps = {
    userId: string | number;
};

export function ProfileReviewsSection({ userId }: ProfileReviewsSectionProps) {
    const [reviews, setReviews] = useState<ReviewClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        async function fetchReviews() {
            setLoading(true);
            setError(null);
            try {
                const data = await userService.getUserReviews(userId);
                if (active) {
                    setReviews(data);
                }
            } catch (err) {
                if (active) {
                    setError("İncelemeler yüklenirken bir hata oluştu.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }
        void fetchReviews();
        return () => {
            active = false;
        };
    }, [userId]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-[#0a101c]/80 px-6 py-12 text-center text-zinc-400">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <p className="mt-4 text-sm font-semibold">İncelemeler yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-8 text-center text-rose-300">
                <p className="text-sm font-semibold">{error}</p>
            </div>
        );
    }

    return (
        <SectionPanel
            description="Kullanıcının oyunlar hakkında yazdığı detaylı incelemeler ve puanlar."
            id="profile-reviews"
            title="Oyun İncelemeleri"
        >
            {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-zinc-500">
                    <Gamepad2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="text-sm font-semibold">Henüz bir oyun incelemesi yazılmamış.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0a101c]/60 p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-[#0a101c]/80"
                        >
                            {/* Neon Parlama Efekti */}
                            <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl transition-all duration-300 group-hover:bg-violet-500/10" />

                            <div className="flex flex-wrap items-start justify-between gap-4">
                                {/* Sol Taraf: Oyun Adı ve İnceleme Tarihi */}
                                <div>
                                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                                        <Gamepad2 className="h-4 w-4 text-violet-400" />
                                        {review.externalGameId ? `Oyun #${review.externalGameId}` : `Oyun #${review.gameId}`}
                                    </h4>
                                    <span className="mt-1 block text-xs text-zinc-500">
                                        {formatProfileDate(review.createdAt)}
                                    </span>
                                </div>

                                {/* Sağ Taraf: Puanlama ve Tavsiye */}
                                <div className="flex items-center gap-3">
                                    {/* Tavsiye Rozeti */}
                                    {review.recommended ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                                            <ThumbsUp className="h-3 w-3" /> Tavsiye Ediyor
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400">
                                            <ThumbsDown className="h-3 w-3" /> Tavsiye Etmiyor
                                        </span>
                                    )}

                                    {/* Rating Yıldızı */}
                                    <div className="flex items-center gap-1 rounded-lg bg-zinc-900/80 px-2.5 py-1 border border-white/5">
                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        <span className="text-xs font-black text-amber-300">{review.rating}/10</span>
                                    </div>
                                </div>
                            </div>

                            {/* İnceleme Metni */}
                            <p className="mt-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap break-words border-l-2 border-violet-500/20 pl-3">
                                {review.reviewText}
                            </p>

                            {/* Alt Bilgi Barı: Oynanış Saati ve Beğeni */}
                            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/5 pt-3 text-xs text-zinc-500">
                                {review.playtimeHours > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-violet-400/80" />
                                        {review.playtimeHours} saat oynandı
                                    </span>
                                )}
                                {review.platform && (
                                    <span className="flex items-center gap-1 capitalize">
                                        <Gamepad2 className="h-3.5 w-3.5 text-zinc-600" />
                                        Platform: {review.platform}
                                    </span>
                                )}
                                {review.likeCount > 0 && (
                                    <span className="ml-auto flex items-center gap-1 text-zinc-400">
                                        <ThumbsUp className="h-3 w-3 text-violet-400" />
                                        {review.likeCount} kişi faydalı buldu
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionPanel>
    );
}
