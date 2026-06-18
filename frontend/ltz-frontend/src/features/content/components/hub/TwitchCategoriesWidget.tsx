import { BarChart3 } from "lucide-react";

import { formatCompactNumber } from "../../../../utils/formatCompactNumber";
import type { TwitchCategoryItem } from "../../types/contentStats.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface TwitchCategoriesWidgetProps {
    categories: TwitchCategoryItem[];
}

export function TwitchCategoriesWidget({
    categories,
}: TwitchCategoriesWidgetProps) {
    const maxViewers =
        categories.reduce((max, item) => Math.max(max, item.viewers), 0) || 1;

    return (
        <HubWidgetCard
            title="Twitch Kategori Radarı"
            subtitle="En çok izlenen oyun kategorileri"
            icon={BarChart3}
        >
            <div className="space-y-3">
                {categories.map((category, index) => {
                    const widthPercent = Math.max(
                        10,
                        Math.round((category.viewers / maxViewers) * 100),
                    );

                    return (
                        <div key={category.gameTitle}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                <span className="truncate font-semibold text-white">
                                    <span className="mr-2 text-fuchsia-300">
                                        #{index + 1}
                                    </span>
                                    {category.gameTitle}
                                </span>
                                <span className="shrink-0 font-bold text-violet-200">
                                    {formatCompactNumber(category.viewers)}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-violet-500 shadow-[0_0_14px_rgba(192,38,211,0.45)]"
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
