import { useEffect, useMemo, useState } from "react";
import { Radio } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cn } from "../../../utils/cn";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { EsportMatchCard } from "../components/esports/EsportMatchCard";
import { contentService } from "../services/contentService";
import type { EsportMatch, EsportMatchStatus } from "../types/esport.types";

const statusFilters: Array<{
    label: string;
    value?: EsportMatchStatus;
}> = [
    { label: "Tümü" },
    { label: "Canlı", value: "LIVE" },
    { label: "Yakında", value: "UPCOMING" },
    { label: "Bitti", value: "FINISHED" },
];

export default function EsportsPage() {
    const [matches, setMatches] = useState<EsportMatch[]>([]);
    const [status, setStatus] = useState<EsportMatchStatus | undefined>();
    const [gameFilter, setGameFilter] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadMatches() {
            setLoading(true);
            setError(null);

            try {
                const result = await contentService.getEsportMatches(status);
                if (!active) return;
                setMatches(result);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(loadError, "Espor maçları yüklenemedi."),
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadMatches();

        return () => {
            active = false;
        };
    }, [status]);

    const gameOptions = useMemo(() => {
        const names = new Set(matches.map((match) => match.gameName));
        return Array.from(names).sort();
    }, [matches]);

    const visibleMatches = useMemo(() => {
        if (!gameFilter) return matches;
        return matches.filter((match) => match.gameName === gameFilter);
    }, [gameFilter, matches]);

    const liveCount = useMemo(
        () => matches.filter((match) => match.status === "LIVE").length,
        [matches],
    );

    return (
        <ContentShell>

            <section className="mb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white">
                            Espor
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-400">
                            Turnuva maçlarını canlı skorlar, yaklaşan
                            karşılaşmalar ve sonuçlarla takip et.
                        </p>
                    </div>

                    {liveCount > 0 ? (
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-100">
                            <Radio size={14} className="animate-pulse" />
                            {liveCount} canlı maç
                        </span>
                    ) : null}
                </div>
            </section>

            <div className="mb-4 flex flex-wrap gap-2">
                {statusFilters.map((filter) => {
                    const active = status === filter.value;

                    return (
                        <button
                            key={filter.label}
                            type="button"
                            onClick={() => {
                                setStatus(filter.value);
                                setGameFilter(undefined);
                            }}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                active
                                    ? "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100"
                                    : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                            )}
                        >
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {gameOptions.length > 1 ? (
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setGameFilter(undefined)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            !gameFilter
                                ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                        )}
                    >
                        Tüm oyunlar
                    </button>
                    {gameOptions.map((game) => (
                        <button
                            key={game}
                            type="button"
                            onClick={() => setGameFilter(game)}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                gameFilter === game
                                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                    : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                            )}
                        >
                            {game}
                        </button>
                    ))}
                </div>
            ) : null}

            {loading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && visibleMatches.length === 0 ? (
                <ContentEmptyState
                    title="Maç bulunamadı"
                    description="Seçili filtre için şu an listelenecek maç yok."
                />
            ) : null}

            {!loading && !error && visibleMatches.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {visibleMatches.map((match) => (
                        <EsportMatchCard key={match.matchId} match={match} />
                    ))}
                </div>
            ) : null}
        </ContentShell>
    );
}
