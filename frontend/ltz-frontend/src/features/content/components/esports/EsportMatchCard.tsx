import { Radio } from "lucide-react";

import { cn } from "../../../../utils/cn";
import type { EsportMatch } from "../../types/esport.types";
import { esportStatusLabel, esportStatusTone } from "../../utils/esportStatus";

interface EsportMatchCardProps {
    match: EsportMatch;
}

function formatMatchTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function EsportMatchCard({ match }: EsportMatchCardProps) {
    return (
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-violet-400/30">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {match.tournamentName}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        {match.gameName} · {formatMatchTime(match.matchTime)}
                    </div>
                </div>

                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                        esportStatusTone(match.status),
                    )}
                >
                    {match.status === "LIVE" ? (
                        <Radio size={12} className="animate-pulse" />
                    ) : null}
                    {esportStatusLabel(match.status)}
                </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right">
                    <div className="text-base font-bold text-white">
                        {match.teamAName}
                    </div>
                </div>

                <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-center text-2xl font-black text-violet-100">
                    {match.teamAScore} - {match.teamBScore}
                </div>

                <div>
                    <div className="text-base font-bold text-white">
                        {match.teamBName}
                    </div>
                </div>
            </div>
        </article>
    );
}
