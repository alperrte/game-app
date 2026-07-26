import { useEffect, useState } from "react";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentShell } from "../components/ContentShell";
import { TriviaLeaderboard } from "../components/trivia/TriviaLeaderboard";
import { TriviaPanel } from "../components/trivia/TriviaPanel";
import { TriviaStreakPanel } from "../components/trivia/TriviaStreakPanel";
import { contentService } from "../services/contentService";
import type { TodayTriviaResponse, TriviaStatsResponse } from "../types/trivia.types";

export default function TriviaPage() {
    const [trivia, setTrivia] = useState<TodayTriviaResponse | null>(null);
    const [stats, setStats] = useState<TriviaStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadTrivia() {
            setLoading(true);
            setError(null);

            try {
                const [triviaResult, statsResult] = await Promise.all([
                    contentService.getTodayTrivia(),
                    contentService
                        .getTriviaStats()
                        .catch(() => null as TriviaStatsResponse | null),
                ]);
                if (!active) return;
                setTrivia(triviaResult);
                setStats(statsResult);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(loadError, "Günlük trivia yüklenemedi."),
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadTrivia();

        return () => {
            active = false;
        };
    }, []);

    function handleTriviaUpdated(updated: TodayTriviaResponse) {
        setTrivia(updated);
        contentService
            .getTriviaStats()
            .then(setStats)
            .catch(() => undefined);
    }

    return (
        <ContentShell>

            <section className="mb-8">
                <h1 className="text-3xl font-black text-white">
                    Günlük Trivia
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Her gün tek soru, tek şans. Oyun bilgini test et.
                </p>
            </section>

            {loading ? (
                <div className="h-80 motion-reduce:animate-none animate-pulse rounded-3xl bg-white/5" />
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && stats ? (
                <TriviaStreakPanel stats={stats} />
            ) : null}

            {!loading && !error && stats ? (
                <TriviaLeaderboard myStats={stats} />
            ) : null}

            {!loading && !error && trivia ? (
                <TriviaPanel initialData={trivia} onUpdated={handleTriviaUpdated} />
            ) : null}
        </ContentShell>
    );
}
