import { Radio, Swords } from "lucide-react";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { EsportMatch } from "../../types/esport.types";
import { cn } from "../../../../utils/cn";
import { esportStatusLabel, esportStatusTone } from "../../utils/esportStatus";
import { HubWidgetCard } from "./HubWidgetCard";

interface EsportLiveStripProps {
    matches: EsportMatch[];
}

export function EsportLiveStrip({ matches }: EsportLiveStripProps) {
    const liveMatches = matches.filter((match) => match.status === "LIVE");
    const previewMatches =
        liveMatches.length > 0
            ? liveMatches
            : matches.filter((match) => match.status === "UPCOMING").slice(0, 3);

    return (
        <HubWidgetCard
            title="Espor Radarı"
            subtitle="Canlı ve yaklaşan maçlar"
            icon={Swords}
            contentClassName="space-y-4"
            action={{
                label: "Tüm maçlar",
                href: CONTENT_ROUTES.esports,
            }}
        >
            {previewMatches.length === 0 ? (
                <p className="text-sm text-slate-400">
                    Şu an listelenecek maç bulunamadı.
                </p>
            ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                    {previewMatches.map((match) => (
                        <article
                            key={match.matchId}
                            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-violet-400/30 hover:bg-white/[0.03]"
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {match.tournamentName}
                                </span>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                                        esportStatusTone(match.status),
                                    )}
                                >
                                    {match.status === "LIVE" ? (
                                        <Radio
                                            size={12}
                                            className="animate-pulse"
                                        />
                                    ) : null}
                                    {esportStatusLabel(match.status)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-bold text-white">
                                        {match.teamAName}
                                    </div>
                                    <div className="truncate text-sm font-bold text-white">
                                        {match.teamBName}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-center text-lg font-black text-violet-100">
                                    {match.teamAScore} - {match.teamBScore}
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-slate-400">
                                {match.gameName}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </HubWidgetCard>
    );
}
