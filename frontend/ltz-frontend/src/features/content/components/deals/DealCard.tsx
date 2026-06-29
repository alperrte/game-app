import { useState } from "react";
import { ExternalLink, Gamepad2, Users } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";
import { cn } from "../../../../utils/cn";
import { optimizeImageUrl } from "../../../../utils/optimizeImageUrl";
import type { DealCampaign } from "../../types/deals.types";
import { SteamDeckBadge } from "./SteamDeckBadge";

interface DealCardProps {
    deal: DealCampaign;
    highlight?: boolean;
}

export function DealCard({ deal, highlight = false }: DealCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const endsLabel = deal.endsAt
        ? formatTimeRemaining(deal.endsAt)
        : null;

    const optimizedUrl = optimizeImageUrl(deal.imageUrl);
    const canShowImage = Boolean(optimizedUrl) && !imageFailed;

    return (
        <article
            className={cn(
                "overflow-hidden rounded-2xl border bg-slate-950/70 transition hover:-translate-y-0.5 hover:border-violet-400/30",
                highlight
                    ? "border-fuchsia-400/40 shadow-[0_0_24px_rgba(217,70,239,0.15)]"
                    : "border-white/10",
            )}
        >
            <div className="relative aspect-[452/283] overflow-hidden bg-violet-500/5">
                {canShowImage ? (
                    <img
                        src={optimizedUrl}
                        alt={deal.gameTitle}
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

                {endsLabel ? (
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {endsLabel}
                    </span>
                ) : null}
            </div>

            <div className="space-y-3 p-4">
                <div>
                    <h3 className="line-clamp-2 text-base font-bold text-white">
                        {deal.gameTitle}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                        {deal.storeName}
                    </p>
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
                    </div>

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
        </article>
    );
}
