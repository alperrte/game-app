import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { HistoryTimeline } from "../components/history/HistoryTimeline";
import { contentService } from "../services/contentService";
import type { GamingHistoryEvent } from "../types/history.types";

export default function HistoryPage() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [day, setDay] = useState(today.getDate());
    const [events, setEvents] = useState<GamingHistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadHistory() {
            setLoading(true);
            setError(null);

            try {
                const result = await contentService.getHistoryByDate(
                    month,
                    day,
                );
                if (!active) return;
                setEvents(result);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(loadError, "Oyun tarihi yüklenemedi."),
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadHistory();

        return () => {
            active = false;
        };
    }, [day, month]);

    function handleToday() {
        const now = new Date();
        setMonth(now.getMonth() + 1);
        setDay(now.getDate());
    }

    return (
        <ContentShell>

            <section className="mb-8">
                <h1 className="text-3xl font-black text-white">Oyun Tarihi</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Seçtiğin günde oyun dünyasında yaşanan önemli olayları
                    kronolojik zaman tünelinde gör.
                </p>
            </section>

            <Card className="mb-6 border-white/10 bg-slate-950/55 p-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                    <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Ay
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={12}
                            value={month}
                            onChange={(event) =>
                                setMonth(Number(event.target.value))
                            }
                            className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/50"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Gün
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={day}
                            onChange={(event) =>
                                setDay(Number(event.target.value))
                            }
                            className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/50"
                        />
                    </label>

                    <Button type="button" variant="ghost" onClick={handleToday}>
                        Bugün
                    </Button>
                </div>
            </Card>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-32 motion-reduce:animate-none animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && events.length === 0 ? (
                <ContentEmptyState
                    title="Bu tarihte kayıt yok"
                    description="Seçilen gün için henüz oyun tarihi verisi eklenmemiş."
                />
            ) : null}

            {!loading && !error && events.length > 0 ? (
                <HistoryTimeline events={events} />
            ) : null}
        </ContentShell>
    );
}
