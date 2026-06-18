import { Gift } from "lucide-react";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { FreeGameItem } from "../../types/contentStats.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface FreeGamesStripProps {
    games: FreeGameItem[];
}

export function FreeGamesStrip({ games }: FreeGamesStripProps) {
    return (
        <HubWidgetCard
            title="Ücretsiz Oyunlar"
            subtitle="Epic ve giveaway fırsatları"
            icon={Gift}
            contentClassName="space-y-3"
            action={{
                label: "Tümünü gör",
                href: CONTENT_ROUTES.free,
            }}
        >
            {games.length === 0 ? (
                <p className="text-sm text-slate-400">
                    Şu an ücretsiz oyun listesi boş.
                </p>
            ) : (
                games.slice(0, 4).map((game) => (
                    <a
                        key={`${game.gameTitle}-${game.dealUrl}`}
                        href={game.dealUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 transition hover:border-violet-400/30 hover:bg-white/[0.03]"
                    >
                        {game.imageUrl ? (
                            <img
                                src={game.imageUrl}
                                alt={game.gameTitle}
                                className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-violet-500/10 text-xs font-bold text-violet-200">
                                FREE
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white group-hover:text-fuchsia-200">
                                {game.gameTitle}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                                {game.storeName}
                                {game.isGiveaway ? " · Giveaway" : ""}
                            </div>
                            {game.worth ? (
                                <div className="mt-1 text-xs font-semibold text-violet-200">
                                    Değer: {game.worth}
                                </div>
                            ) : null}
                        </div>
                    </a>
                ))
            )}
        </HubWidgetCard>
    );
}
