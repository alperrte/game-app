import { ExternalLink, Gift } from "lucide-react";

import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";
import type { FreeGameItem } from "../../types/contentStats.types";

interface FreeGamePromoCardProps {
    game: FreeGameItem;
}

export function FreeGamePromoCard({ game }: FreeGamePromoCardProps) {
    const remaining = formatTimeRemaining(game.endsAt);

    return (
        <a
            href={game.dealUrl}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-950/30 to-slate-950/80 transition hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:shadow-[0_0_28px_rgba(217,70,239,0.15)]"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-violet-500/5">
                {game.imageUrl ? (
                    <img
                        src={game.imageUrl}
                        alt={game.gameTitle}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="grid h-full place-items-center text-violet-200">
                        <Gift size={32} />
                    </div>
                )}

                <span className="absolute left-3 top-3 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-100">
                    {game.isGiveaway ? "Giveaway" : "Ücretsiz"}
                </span>

                {remaining ? (
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {remaining}
                    </span>
                ) : null}
            </div>

            <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-base font-bold text-white group-hover:text-fuchsia-200">
                    {game.gameTitle}
                </h3>
                <p className="text-xs text-slate-400">{game.storeName}</p>
                {game.worth ? (
                    <p className="text-xs font-semibold text-violet-200">
                        Tahmini değer: {game.worth}
                    </p>
                ) : null}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
                    Mağazaya git
                    <ExternalLink size={13} />
                </span>
            </div>
        </a>
    );
}
