import { Timer } from "lucide-react";

import type { SpeedrunRecord } from "../../types/contentStats.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface SpeedrunWidgetProps {
    records: SpeedrunRecord[];
}

export function SpeedrunWidget({ records }: SpeedrunWidgetProps) {
    return (
        <HubWidgetCard
            title="Speedrun Rekorları"
            subtitle="Güncel dünya rekorları"
            icon={Timer}
            contentClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
            {records.length === 0 ? (
                <p className="text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                    Speedrun verisi bulunamadı.
                </p>
            ) : (
                records.map((record) => (
                    <article
                        key={`${record.gameTitle}-${record.category}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-violet-400/30"
                    >
                        <div className="text-sm font-bold text-white">
                            {record.gameTitle}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                            {record.category}
                        </div>
                        <div className="mt-3 text-2xl font-black text-fuchsia-300">
                            {record.time}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            {record.runner}
                        </div>
                        {record.videoUrl ? (
                            <a
                                href={record.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex text-xs font-semibold text-violet-200 transition hover:text-fuchsia-200"
                            >
                                Kanıt videosunu izle →
                            </a>
                        ) : null}
                    </article>
                ))
            )}
        </HubWidgetCard>
    );
}
