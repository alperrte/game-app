import { useState } from "react";
import { Sparkles, X } from "lucide-react";

import type { DealCampaign } from "../../types/deals.types";
import type { EsportMatch } from "../../types/esport.types";
import type { NewsArticle } from "../../types/news.types";

interface WhatYouMissedBannerProps {
    lastVisit: string | null;
    news: NewsArticle[];
    deals: DealCampaign[];
    esportMatches: EsportMatch[];
}

const MIN_GAP_MS = 30 * 60 * 1000;

export function WhatYouMissedBanner({
    lastVisit,
    news,
    deals,
    esportMatches,
}: WhatYouMissedBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || !lastVisit) return null;

    const lastVisitTime = new Date(lastVisit).getTime();
    if (Number.isNaN(lastVisitTime) || Date.now() - lastVisitTime < MIN_GAP_MS) {
        return null;
    }

    const newNewsCount = news.filter(
        (article) => new Date(article.createdAt).getTime() > lastVisitTime,
    ).length;
    const newDealsCount = deals.filter(
        (deal) => new Date(deal.lastUpdated).getTime() > lastVisitTime,
    ).length;
    const finishedMatchesCount = esportMatches.filter(
        (match) =>
            match.status === "FINISHED" &&
            new Date(match.matchTime).getTime() > lastVisitTime,
    ).length;

    const parts: string[] = [];
    if (newNewsCount > 0) parts.push(`${newNewsCount} yeni haber`);
    if (newDealsCount > 0) parts.push(`${newDealsCount} güncellenen indirim`);
    if (finishedMatchesCount > 0)
        parts.push(`${finishedMatchesCount} sonuçlanan maç`);

    if (parts.length === 0) return null;

    return (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3">
            <Sparkles size={18} className="shrink-0 text-violet-300" />
            <p className="min-w-0 flex-1 text-sm text-violet-100">
                <span className="font-bold">Son ziyaretinden beri: </span>
                {parts.join(", ")} (önizlemede).
            </p>
            <button
                type="button"
                aria-label="Kapat"
                onClick={() => setDismissed(true)}
                className="shrink-0 rounded-lg p-1 text-violet-300 transition hover:bg-white/10 hover:text-white"
            >
                <X size={16} />
            </button>
        </div>
    );
}
