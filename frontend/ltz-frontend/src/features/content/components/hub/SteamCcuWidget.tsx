import { Users } from "lucide-react";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import { formatCompactNumber } from "../../../../utils/formatCompactNumber";
import type { SteamTopPlayedItem } from "../../types/contentStats.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface SteamCcuWidgetProps {
    games: SteamTopPlayedItem[];
}

export function SteamCcuWidget({ games }: SteamCcuWidgetProps) {
    const maxCcu = games.reduce((max, game) => Math.max(max, game.ccu), 0) || 1;

    return (
        <HubWidgetCard
            title="Steam En Çok Oynananlar"
            subtitle="Anlık eşzamanlı oyuncu sayıları"
            icon={Users}
            action={{
                label: "İndirimlere git",
                href: CONTENT_ROUTES.deals,
            }}
        >
            <div className="space-y-3">
                {games.map((game) => {
                    const widthPercent = Math.max(
                        8,
                        Math.round((game.ccu / maxCcu) * 100),
                    );

                    return (
                        <div key={`${game.rank}-${game.gameTitle}`}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                <span className="truncate font-semibold text-white">
                                    <span className="mr-2 text-violet-300">
                                        #{game.rank}
                                    </span>
                                    {game.gameTitle}
                                </span>
                                <span className="shrink-0 font-bold text-fuchsia-200">
                                    {formatCompactNumber(game.ccu)}
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_rgba(168,85,247,0.55)]"
                                    style={{ width: `${widthPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </HubWidgetCard>
    );
}
