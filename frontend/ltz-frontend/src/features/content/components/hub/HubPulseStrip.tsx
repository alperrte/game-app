import { Gift, Newspaper, Percent, Radio, Swords, Tv, Users } from "lucide-react";

import { formatCompactNumber } from "../../../../utils/formatCompactNumber";
import type { ContentStatsResponse } from "../../types/contentStats.types";
import type { EsportMatch } from "../../types/esport.types";

interface HubPulseStripProps {
    stats: ContentStatsResponse;
    esportMatches: EsportMatch[];
    newsCount: number;
    dealsCount: number;
    topDealDiscount: number;
}

interface PulseItem {
    label: string;
    value: string;
    detail: string;
    icon: typeof Users;
    tone: string;
    live?: boolean;
}

export function HubPulseStrip({
    stats,
    esportMatches,
    newsCount,
    dealsCount,
    topDealDiscount,
}: HubPulseStripProps) {
    const liveMatches = esportMatches.filter((m) => m.status === "LIVE").length;
    const peakCcu =
        stats.steam_top_played?.reduce(
            (max, game) => Math.max(max, game.ccu),
            0,
        ) ?? 0;
    const twitchViewers =
        stats.twitch_live_streams?.reduce(
            (sum, stream) => sum + stream.viewers,
            0,
        ) ?? 0;
    const freeCount = stats.free_games?.length ?? 0;

    const items: PulseItem[] = [
        {
            label: "Haber",
            value: String(newsCount),
            detail: "RSS akışı",
            icon: Newspaper,
            tone: "border-violet-400/30 bg-violet-500/10 text-violet-100",
        },
        {
            label: "İndirim",
            value: dealsCount > 0 ? String(dealsCount) : "—",
            detail:
                topDealDiscount > 0 ? `En yüksek %${topDealDiscount}` : "CheapShark",
            icon: Percent,
            tone: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100",
        },
        {
            label: "Canlı Espor",
            value: String(liveMatches),
            detail: "Aktif maç",
            icon: Swords,
            tone: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100",
            live: liveMatches > 0,
        },
        {
            label: "Steam CCU",
            value: peakCcu > 0 ? formatCompactNumber(peakCcu) : "—",
            detail: "Oyuncu zirvesi",
            icon: Users,
            tone: "border-purple-400/30 bg-purple-500/10 text-purple-100",
        },
        {
            label: "Twitch",
            value: twitchViewers > 0 ? formatCompactNumber(twitchViewers) : "—",
            detail: "Takip edilen yayınlar",
            icon: Tv,
            tone: "border-purple-400/30 bg-purple-500/10 text-purple-100",
        },
        {
            label: "Ücretsiz",
            value: String(freeCount),
            detail: "Epic & giveaway",
            icon: Gift,
            tone: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100",
        },
    ];

    return (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.label}
                        className={`rounded-2xl border px-4 py-3 backdrop-blur-sm ${item.tone}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                                    {item.label}
                                </div>
                                <div className="mt-1 text-2xl font-black">
                                    {item.value}
                                </div>
                                <div className="mt-0.5 truncate text-[10px] opacity-70">
                                    {item.detail}
                                </div>
                            </div>
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20">
                                {item.live ? (
                                    <Radio
                                        size={18}
                                        className="animate-pulse text-fuchsia-300"
                                    />
                                ) : (
                                    <Icon size={18} />
                                )}
                            </span>
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
