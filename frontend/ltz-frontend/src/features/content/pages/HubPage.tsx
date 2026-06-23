import { useEffect, useMemo, useState } from "react";

import { Card } from "../../../components/ui/Card";
import { contentService } from "../services/contentService";
import type { ContentStatsResponse } from "../types/contentStats.types";
import type { DealCampaign } from "../types/deals.types";
import type { EsportMatch } from "../types/esport.types";
import type { NewsArticle } from "../types/news.types";
import type { SpotlightBanner } from "../types/spotlight.types";
import type { TodayTriviaResponse } from "../types/trivia.types";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentShell } from "../components/ContentShell";
import { EsportLiveStrip } from "../components/hub/EsportLiveStrip";
import { FreeGamesStrip } from "../components/hub/FreeGamesStrip";
import { HubDealsPreview } from "../components/hub/HubDealsPreview";
import { HubNewsPreview } from "../components/hub/HubNewsPreview";
import { HubPulseStrip } from "../components/hub/HubPulseStrip";
import { HubTriviaTeaser } from "../components/hub/HubTriviaTeaser";
import { PlatformStatusGrid } from "../components/hub/PlatformStatusGrid";
import { SpeedrunWidget } from "../components/hub/SpeedrunWidget";
import { SpotlightCarousel } from "../components/hub/SpotlightCarousel";
import { SteamCcuWidget } from "../components/hub/SteamCcuWidget";
import { TwitchCategoriesWidget } from "../components/hub/TwitchCategoriesWidget";
import { TwitchStreamsWidget } from "../components/hub/TwitchStreamsWidget";
import { UpcomingReleasesWidget } from "../components/hub/UpcomingReleasesWidget";

function HubSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-24 animate-pulse rounded-2xl bg-white/5"
                    />
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
            </div>
            <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
            <div className="grid gap-6 xl:grid-cols-2">
                <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
            </div>
        </div>
    );
}

export default function HubPage() {
    const [stats, setStats] = useState<ContentStatsResponse | null>(null);
    const [esportMatches, setEsportMatches] = useState<EsportMatch[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [newsTotal, setNewsTotal] = useState(0);
    const [deals, setDeals] = useState<DealCampaign[]>([]);
    const [dealsTotal, setDealsTotal] = useState(0);
    const [trivia, setTrivia] = useState<TodayTriviaResponse | null>(null);
    const [spotlight, setSpotlight] = useState<SpotlightBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const topDealDiscount = useMemo(
        () => deals.reduce((max, deal) => Math.max(max, deal.discountPercent), 0),
        [deals],
    );

    useEffect(() => {
        let active = true;

        async function loadHub() {
            setLoading(true);
            setError(null);

            try {
                const [
                    statsResponse,
                    matchesResponse,
                    newsResponse,
                    dealsResponse,
                    spotlightResponse,
                    triviaResponse,
                ] = await Promise.all([
                    contentService.getStats(),
                    contentService.getEsportMatches(),
                    contentService.getNews({ page: 0, size: 5 }),
                    contentService.getDeals({ page: 0, size: 6, minDiscount: 20 }),
                    contentService
                        .getSpotlightBanners()
                        .catch(() => [] as SpotlightBanner[]),
                    contentService
                        .getTodayTrivia()
                        .catch(() => null as TodayTriviaResponse | null),
                ]);

                if (!active) return;

                setStats(statsResponse);
                setEsportMatches(matchesResponse);
                setNews(newsResponse.content);
                setNewsTotal(newsResponse.totalElements);
                setDeals(dealsResponse.content);
                setDealsTotal(dealsResponse.totalElements);
                setSpotlight(spotlightResponse);
                setTrivia(triviaResponse);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(
                        loadError,
                        "Oyun Merkezi verileri yüklenemedi.",
                    ),
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadHub();

        return () => {
            active = false;
        };
    }, []);

    return (
        <ContentShell>
            {!loading && spotlight.length > 0 ? (
                <SpotlightCarousel banners={spotlight} />
            ) : null}

            {loading ? <HubSkeleton /> : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && stats ? (
                <div className="space-y-6">
                    <HubPulseStrip
                        stats={stats}
                        esportMatches={esportMatches}
                        newsCount={newsTotal}
                        dealsCount={dealsTotal}
                        topDealDiscount={topDealDiscount}
                    />

                    <div className="grid gap-6 xl:grid-cols-2">
                        <HubNewsPreview articles={news} />
                        <HubDealsPreview deals={deals} />
                    </div>

                    {stats.platform_status ? (
                        <PlatformStatusGrid statuses={stats.platform_status} />
                    ) : null}

                    <EsportLiveStrip matches={esportMatches} />

                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        {stats.steam_top_played ? (
                            <SteamCcuWidget games={stats.steam_top_played} />
                        ) : null}

                        {stats.twitch_top_categories ? (
                            <TwitchCategoriesWidget
                                categories={stats.twitch_top_categories}
                            />
                        ) : null}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        {stats.free_games ? (
                            <FreeGamesStrip games={stats.free_games} />
                        ) : null}

                        {stats.speedrun_records ? (
                            <SpeedrunWidget records={stats.speedrun_records} />
                        ) : null}
                    </div>

                    {stats.twitch_live_streams ? (
                        <TwitchStreamsWidget
                            streams={stats.twitch_live_streams}
                        />
                    ) : null}

                    {stats.upcoming_releases ? (
                        <UpcomingReleasesWidget
                            releases={stats.upcoming_releases}
                        />
                    ) : null}

                    {trivia ? <HubTriviaTeaser trivia={trivia} /> : null}
                </div>
            ) : null}
        </ContentShell>
    );
}
