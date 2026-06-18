import { useEffect, useMemo, useState } from "react";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { DealCard } from "../components/deals/DealCard";
import { FreeGamePromoCard } from "../components/free/FreeGamePromoCard";
import { contentService } from "../services/contentService";
import type { FreeGameItem } from "../types/contentStats.types";
import type { DealCampaign } from "../types/deals.types";

export default function FreeGamesPage() {
    const [games, setGames] = useState<DealCampaign[]>([]);
    const [promos, setPromos] = useState<FreeGameItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadFreeGames() {
            setLoading(true);
            setError(null);

            try {
                const [deals, stats] = await Promise.all([
                    contentService.getFreeGames(),
                    contentService.getStats(),
                ]);

                if (!active) return;
                setGames(deals);
                setPromos(stats.free_games ?? []);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(
                        loadError,
                        "Ücretsiz oyunlar yüklenemedi.",
                    ),
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadFreeGames();

        return () => {
            active = false;
        };
    }, []);

    const giveawayCount = useMemo(
        () => promos.filter((item) => item.isGiveaway).length,
        [promos],
    );

    const hasContent = games.length > 0 || promos.length > 0;

    return (
        <ContentShell>

            <section className="mb-8">
                <h1 className="text-3xl font-black text-white">
                    Ücretsiz Oyunlar
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Epic Games Store, giveaway kampanyaları ve mağaza
                    ücretsizlerini tek ekranda topla.
                </p>

                {!loading && hasContent ? (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-semibold text-fuchsia-100">
                            {promos.length} canlı fırsat
                        </span>
                        {giveawayCount > 0 ? (
                            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 font-semibold text-violet-100">
                                {giveawayCount} giveaway
                            </span>
                        ) : null}
                        {games.length > 0 ? (
                            <span className="rounded-full border border-white/10 px-3 py-1.5 font-semibold text-slate-300">
                                {games.length} mağaza kaydı
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </section>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-72 animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && !hasContent ? (
                <ContentEmptyState
                    title="Ücretsiz oyun yok"
                    description="Şu an aktif ücretsiz kampanya listelenmiyor."
                />
            ) : null}

            {!loading && !error && hasContent ? (
                <div className="space-y-10">
                    {promos.length > 0 ? (
                        <section>
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
                                Canlı kampanyalar
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {promos.map((game) => (
                                    <FreeGamePromoCard
                                        key={`${game.gameTitle}-${game.dealUrl}`}
                                        game={game}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {games.length > 0 ? (
                        <section>
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
                                Mağaza ücretsizleri
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {games.map((game) => (
                                    <DealCard
                                        key={game.id}
                                        deal={game}
                                        highlight
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            ) : null}
        </ContentShell>
    );
}
