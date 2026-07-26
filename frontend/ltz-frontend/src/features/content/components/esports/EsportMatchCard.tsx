import { Radio, Tag } from "lucide-react";
import { Link } from "react-router-dom";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import { cn } from "../../../../utils/cn";
import type { EsportMatch } from "../../types/esport.types";
import { esportStatusLabel, esportStatusTone } from "../../utils/esportStatus";
import { ShareToFeedButton } from "../shared/ShareToFeedButton";

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

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                            esportStatusTone(match.status),
                        )}
                    >
                        {match.status === "LIVE" ? (
                            <Radio size={12} className="animate-pulse motion-reduce:animate-none" />
                        ) : null}
                        {esportStatusLabel(match.status)}
                    </span>
                    {match.isSimulated ? (
                        <span
                            title="Canlı veri kaynağı şu an erişilemiyor; bu bir örnek/simüle maçtır."
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400"
                        >
                            Simüle veri
                        </span>
                    ) : null}
                </div>
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                    to={`${CONTENT_ROUTES.deals}?q=${encodeURIComponent(match.gameName)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-fuchsia-200"
                >
                    <Tag size={12} />
                    {match.gameName} indirimlerini ara
                </Link>

                {match.status === "LIVE" ? (
                    <ShareToFeedButton
                        content={`Canlı izliyorum: ${match.teamAName} vs ${match.teamBName} (${match.tournamentName}) — skor ${match.teamAScore}-${match.teamBScore}. Arkadaşlar, gelin birlikte izleyelim!`}
                    />
                ) : null}
            </div>
        </article>
    );
}
