import { Tv } from "lucide-react";

import { formatCompactNumber } from "../../../../utils/formatCompactNumber";
import type { TwitchLiveStream } from "../../types/contentStats.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface TwitchStreamsWidgetProps {
    streams: TwitchLiveStream[];
}

export function TwitchStreamsWidget({ streams }: TwitchStreamsWidgetProps) {
    return (
        <HubWidgetCard
            title="Twitch Canlı Yayınlar"
            subtitle="Popüler yayıncılar"
            icon={Tv}
            contentClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
            {streams.length === 0 ? (
                <p className="text-sm text-slate-400 md:col-span-2 xl:col-span-4">
                    Canlı yayın verisi bulunamadı.
                </p>
            ) : (
                streams.map((stream) => (
                    <a
                        key={stream.streamUrl}
                        href={stream.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-fuchsia-400/30 hover:shadow-[0_0_24px_rgba(217,70,239,0.18)]"
                    >
                        <div className="relative aspect-video overflow-hidden">
                            {stream.thumbnailUrl ? (
                                <img
                                    src={stream.thumbnailUrl}
                                    alt={stream.title}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center bg-violet-500/10 text-sm text-violet-200">
                                    Yayın
                                </div>
                            )}

                            <span className="absolute left-3 top-3 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-100">
                                Canlı
                            </span>
                        </div>

                        <div className="space-y-1 p-4">
                            <div className="truncate text-sm font-bold text-white">
                                {stream.broadcaster}
                            </div>
                            <div className="line-clamp-2 text-xs text-slate-400">
                                {stream.title}
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                                <span className="text-slate-500">
                                    {stream.gameName}
                                </span>
                                <span className="font-semibold text-violet-200">
                                    {formatCompactNumber(stream.viewers)} izleyici
                                </span>
                            </div>
                        </div>
                    </a>
                ))
            )}
        </HubWidgetCard>
    );
}
