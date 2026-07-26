import { useState } from "react";
import { Bookmark, ChevronDown, ExternalLink, Gamepad2, Scale, TrendingDown, Users } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";
import { cn } from "../../../../utils/cn";
import { optimizeImageUrl } from "../../../../utils/optimizeImageUrl";
import type { DealCampaign } from "../../types/deals.types";
import { normalizeReactions } from "../../utils/reactions";
import { isWatched, toggleWatchlist } from "../../utils/watchlist";
import { CopyLinkButton } from "../shared/CopyLinkButton";
import { ReactionBar } from "../shared/ReactionBar";
import { ShareToFeedButton } from "../shared/ShareToFeedButton";
import { PriceSparkline } from "./PriceSparkline";
import { SteamDeckBadge } from "./SteamDeckBadge";

interface DealCardProps {
    deal: DealCampaign;
    highlight?: boolean;
    compareSelected?: boolean;
    onToggleCompare?: () => void;
}

export function DealCard({
    deal,
    highlight = false,
    compareSelected,
    onToggleCompare,
}: DealCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const [reactions, setReactions] = useState(deal.reactions);
    const [userReaction, setUserReaction] = useState(deal.userReaction ?? null);
    const [watched, setWatched] = useState(() => isWatched(deal.gameTitle));
    const [showTrend, setShowTrend] = useState(false);
    const endsLabel = deal.endsAt
        ? formatTimeRemaining(deal.endsAt)
        : null;

    const optimizedUrl = optimizeImageUrl(deal.imageUrl);
    const canShowImage = Boolean(optimizedUrl) && !imageFailed;
    const isHistoricalLow =
        deal.historicalLow != null &&
        deal.discountedPrice <= deal.historicalLow.lowestPrice;

    return (
        <article
            className={cn(
                "overflow-hidden rounded-2xl border bg-slate-950/70 transition hover:-translate-y-0.5 hover:border-violet-400/30",
                highlight
                    ? "border-fuchsia-400/40 shadow-[0_0_24px_rgba(217,70,239,0.15)]"
                    : watched
                      ? "border-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                      : "border-white/10",
            )}
        >
            <div className="relative aspect-[452/283] overflow-hidden bg-violet-500/5">
                {canShowImage ? (
                    <img
                        src={optimizedUrl}
                        alt={deal.gameTitle}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="grid h-full place-items-center text-sm font-semibold text-violet-200">
                        {deal.gameTitle}
                    </div>
                )}

                <span className="absolute left-3 top-3 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 text-xs font-black text-fuchsia-100">
                    {deal.free ? "ÜCRETSİZ" : `-${deal.discountPercent}%`}
                </span>

                <button
                    type="button"
                    aria-label={watched ? "İzleme listesinden çıkar" : "İzleme listesine ekle"}
                    aria-pressed={watched}
                    onClick={() => setWatched(toggleWatchlist(deal.gameTitle))}
                    className={cn(
                        "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border backdrop-blur transition",
                        watched
                            ? "border-violet-400/50 bg-violet-500/30 text-violet-100"
                            : "border-white/15 bg-black/40 text-white/70 hover:text-white",
                    )}
                >
                    <Bookmark size={14} fill={watched ? "currentColor" : "none"} />
                </button>

                {endsLabel ? (
                    <span className="absolute right-3 top-14 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {endsLabel}
                    </span>
                ) : null}
            </div>

            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="line-clamp-2 text-base font-bold text-white">
                            {deal.gameTitle}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                            {deal.storeName}
                        </p>
                    </div>

                    {onToggleCompare ? (
                        <button
                            type="button"
                            aria-pressed={compareSelected}
                            onClick={onToggleCompare}
                            className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold transition",
                                compareSelected
                                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                    : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                            )}
                        >
                            <Scale size={11} />
                            Karşılaştır
                        </button>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SteamDeckBadge status={deal.steamDeckStatus} />
                    {deal.metacriticScore ? (
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">
                            MC {deal.metacriticScore}
                        </span>
                    ) : null}
                    {deal.steamRatingPercent ? (
                        <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-100">
                            Steam %{deal.steamRatingPercent}
                        </span>
                    ) : null}
                    {deal.crossPlay ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">
                            <Users size={10} />
                            Cross-play
                        </span>
                    ) : null}
                    {deal.free ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-bold text-fuchsia-100">
                            <Gamepad2 size={10} />
                            Free
                        </span>
                    ) : null}
                </div>

                <div className="flex items-end justify-between gap-3">
                    <div>
                        <div className="text-lg font-black text-fuchsia-300">
                            {formatCurrency(
                                deal.discountedPrice,
                                deal.currency,
                            )}
                        </div>
                        {!deal.free ? (
                            <div className="text-xs text-slate-500 line-through">
                                {formatCurrency(
                                    deal.originalPrice,
                                    deal.currency,
                                )}
                            </div>
                        ) : null}
                        {isHistoricalLow ? (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300">
                                <TrendingDown size={12} />
                                Tarihi en düşük fiyat
                            </div>
                        ) : deal.historicalLow ? (
                            <div className="mt-1 text-[10px] text-slate-500">
                                Rekor:{" "}
                                {formatCurrency(
                                    deal.historicalLow.lowestPrice,
                                    deal.historicalLow.currency,
                                )}
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setShowTrend((current) => !current)}
                            aria-expanded={showTrend}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 transition hover:text-white"
                        >
                            <ChevronDown
                                size={11}
                                className={cn(
                                    "transition-transform",
                                    showTrend && "rotate-180",
                                )}
                            />
                            Fiyat trendi
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <CopyLinkButton url={deal.dealUrl} />
                        <ShareToFeedButton
                            content={`${deal.gameTitle} ${deal.free ? "ücretsiz" : `%${deal.discountPercent} indirimde`} — ${deal.storeName}\n\n${deal.dealUrl}`}
                            imageUrl={deal.imageUrl}
                        />
                        <a
                            href={deal.dealUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/20"
                        >
                            Mağazaya git
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                {showTrend ? <PriceSparkline gameTitle={deal.gameTitle} /> : null}

                <ReactionBar
                    contentId={deal.id}
                    contentType="CAMPAIGN"
                    reactions={normalizeReactions(reactions)}
                    userReaction={userReaction}
                    onChange={({ reactions: next, userReaction: nextUser }) => {
                        setReactions(next);
                        setUserReaction(nextUser);
                    }}
                />
            </div>
        </article>
    );
}
