import { useState } from "react";
import { Percent } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { optimizeImageUrl } from "../../../../utils/optimizeImageUrl";
import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { DealCampaign } from "../../types/deals.types";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { isWatched } from "../../utils/watchlist";
import { HubWidgetCard } from "./HubWidgetCard";

interface HubDealsPreviewProps {
    deals: DealCampaign[];
}

function HubDealCard({ deal }: { deal: DealCampaign }) {
    const [imageFailed, setImageFailed] = useState(false);
    const optimizedUrl = optimizeImageUrl(deal.imageUrl);
    const canShowImage = Boolean(optimizedUrl) && !imageFailed;
    const watched = isWatched(deal.gameTitle);

    return (
        <a
            href={deal.dealUrl}
            target="_blank"
            rel="noreferrer"
            className={`group overflow-hidden rounded-2xl border bg-slate-950/70 transition hover:border-fuchsia-400/30 hover:bg-white/[0.02] ${
                watched ? "border-violet-400/40" : "border-white/10"
            }`}
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
                    <div className="grid h-full place-items-center px-3 text-center text-xs font-bold text-violet-200">
                        {deal.gameTitle}
                    </div>
                )}
                <span className="absolute left-2 top-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/25 px-2 py-0.5 text-[10px] font-black text-fuchsia-100">
                    {deal.free
                        ? "ÜCRETSİZ"
                        : `-${deal.discountPercent}%`}
                </span>
                {watched ? (
                    <span className="absolute right-2 top-2 rounded-full border border-violet-400/50 bg-violet-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-violet-100">
                        Takipte
                    </span>
                ) : null}
            </div>

            <div className="space-y-1 p-3">
                <div className="line-clamp-2 text-sm font-bold text-white group-hover:text-fuchsia-200">
                    {deal.gameTitle}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                        {deal.storeName}
                    </span>
                    <span className="font-bold text-violet-200">
                        {formatCurrency(
                            deal.discountedPrice,
                            deal.currency,
                        )}
                    </span>
                </div>
            </div>
        </a>
    );
}

export function HubDealsPreview({ deals }: HubDealsPreviewProps) {
    const latestUpdate = deals.reduce<string | null>((latest, deal) => {
        if (!deal.lastUpdated) return latest;
        if (!latest || deal.lastUpdated > latest) return deal.lastUpdated;
        return latest;
    }, null);
    const freshness = formatRelativeTime(latestUpdate);

    const sortedDeals = [...deals].sort((a, b) => {
        const aWatched = isWatched(a.gameTitle) ? 1 : 0;
        const bWatched = isWatched(b.gameTitle) ? 1 : 0;
        return bWatched - aWatched;
    });

    return (
        <HubWidgetCard
            title="Günün İndirimleri"
            subtitle={
                freshness
                    ? `CheapShark üzerinden canlı fiyatlar · ${freshness} güncellendi`
                    : "CheapShark üzerinden canlı fiyatlar"
            }
            icon={Percent}
            action={{ label: "Tümünü gör", href: CONTENT_ROUTES.deals }}
            contentClassName="grid gap-3 sm:grid-cols-2"
        >
            {deals.length === 0 ? (
                <p className="text-sm text-slate-400 sm:col-span-2">
                    Aktif indirim kampanyası bulunamadı.
                </p>
            ) : (
                sortedDeals.slice(0, 4).map((deal) => (
                    <HubDealCard key={deal.id} deal={deal} />
                ))
            )}
        </HubWidgetCard>
    );
}
