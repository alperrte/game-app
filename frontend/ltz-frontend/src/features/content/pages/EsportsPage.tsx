import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Radio, Search, Swords } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cn } from "../../../utils/cn";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { EsportMatchCard } from "../components/esports/EsportMatchCard";
import { ChipScrollRow } from "../components/shared/ChipScrollRow";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const status = (searchParams.get("status") as EsportMatchStatus | null) ?? undefined;
    const gameFilter = searchParams.get("game") ?? undefined;
    const searchQuery = searchParams.get("q") ?? "";

    const [matches, setMatches] = useState<EsportMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadMatches(showSpinner: boolean) {
            if (showSpinner) {
                setLoading(true);
                setError(null);
            }

            try {
                const result = await contentService.getEsportMatches(status);
                if (!active) return;
                setMatches(result);
                if (showSpinner) setError(null);
            } catch (loadError) {
                if (!active) return;
                if (showSpinner) {
                    setError(
                        getErrorMessage(loadError, "Espor maçları yüklenemedi."),
                    );
                }
            } finally {
                if (active && showSpinner) setLoading(false);
            }
        }

        void loadMatches(true);

        // Canlı maç skorları için sayfa açıkken periyodik sessiz yenileme
        const intervalId = window.setInterval(() => {
            void loadMatches(false);
        }, 30000);

        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [status]);

    const gameOptions = useMemo(() => {
        const names = new Set(matches.map((match) => match.gameName));
        return Array.from(names).sort();
    }, [matches]);

    const visibleMatches = useMemo(() => {
        let result = gameFilter
            ? matches.filter((match) => match.gameName === gameFilter)
            : matches;

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(
                (match) =>
                    match.teamAName.toLowerCase().includes(q) ||
                    match.teamBName.toLowerCase().includes(q) ||
                    match.tournamentName.toLowerCase().includes(q),
            );
        }

        return result;
    }, [gameFilter, matches, searchQuery]);

    function handleSearchChange(value: string) {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (value.trim()) params.set("q", value);
            else params.delete("q");
            return params;
        });
    }

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
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-rose-100">
                            <Radio size={14} className="animate-pulse motion-reduce:animate-none" />
                            {liveCount} canlı maç
                        </span>
                    ) : null}
                </div>
            </section>

            <label className="relative mb-4 block">
                <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Takım veya turnuva adına göre ara..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50"
                />
            </label>

            <ChipScrollRow className="mb-4">
                {statusFilters.map((filter) => {
                    const active = status === filter.value;

                    return (
                        <button
                            key={filter.label}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                                setSearchParams((prev) => {
                                    const params = new URLSearchParams(prev);
                                    if (filter.value) params.set("status", filter.value);
                                    else params.delete("status");
                                    params.delete("game");
                                    return params;
                                })
                            }
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
            </ChipScrollRow>

            {gameOptions.length > 1 ? (
                <ChipScrollRow className="mb-6">
                    <button
                        type="button"
                        aria-pressed={!gameFilter}
                        onClick={() =>
                            setSearchParams((prev) => {
                                const params = new URLSearchParams(prev);
                                params.delete("game");
                                return params;
                            })
                        }
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
                            aria-pressed={gameFilter === game}
                            onClick={() =>
                                setSearchParams((prev) => {
                                    const params = new URLSearchParams(prev);
                                    params.set("game", game);
                                    return params;
                                })
                            }
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
                </ChipScrollRow>
            ) : null}

            {loading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 motion-reduce:animate-none animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            <AnimatePresence mode="wait">
                {!loading && !error ? (
                    <motion.div
                        key={`${status ?? "all"}-${gameFilter ?? "all"}-${searchQuery}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {visibleMatches.length === 0 ? (
                            <ContentEmptyState
                                icon={Swords}
                                title="Maç bulunamadı"
                                description="Seçili filtre için şu an listelenecek maç yok."
                            />
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {visibleMatches.map((match) => (
                                    <EsportMatchCard key={match.matchId} match={match} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </ContentShell>
    );
}
