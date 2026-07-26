import { CalendarDays } from "lucide-react";
import { useState } from "react";

import type { UpcomingRelease } from "../../types/contentStats.types";
import { optimizeImageUrl } from "../../../../utils/optimizeImageUrl";
import { HubWidgetCard } from "./HubWidgetCard";

interface UpcomingReleasesWidgetProps {
    releases: UpcomingRelease[];
}

function formatReleaseDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function ReleaseCover({
    title,
    imageUrl,
}: {
    title: string;
    imageUrl?: string | null;
}) {
    const [failed, setFailed] = useState(false);
    const optimizedUrl = optimizeImageUrl(imageUrl);
    const canShowImage = Boolean(optimizedUrl) && !failed;

    if (!canShowImage) {
        return (
            <div className="grid aspect-[450/253] place-items-center bg-gradient-to-br from-violet-950/60 to-slate-950/80 px-4 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
                    {title}
                </span>
            </div>
        );
    }

    return (
        <img
            src={optimizedUrl}
            alt={title}
            loading="lazy"
            className="aspect-[450/253] w-full object-cover"
            onError={() => setFailed(true)}
        />
    );
}

export function UpcomingReleasesWidget({
    releases,
}: UpcomingReleasesWidgetProps) {
    return (
        <HubWidgetCard
            title="Yaklaşan Çıkışlar"
            subtitle="Takvimdeki yeni oyunlar"
            icon={CalendarDays}
            contentClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
            {releases.length === 0 ? (
                <p className="text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                    Yaklaşan çıkış verisi bulunamadı.
                </p>
            ) : (
                releases.map((release) => (
                    <article
                        key={`${release.gameTitle}-${release.releaseDate}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-violet-400/30"
                    >
                        <ReleaseCover
                            title={release.gameTitle}
                            imageUrl={release.imageUrl}
                        />

                        <div className="space-y-2 p-4">
                            <div className="text-sm font-bold text-white">
                                {release.gameTitle}
                            </div>
                            <div className="text-xs font-semibold text-fuchsia-300">
                                {formatReleaseDate(release.releaseDate)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {release.platforms.map((platform) => (
                                    <span
                                        key={platform}
                                        className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100"
                                    >
                                        {platform}
                                    </span>
                                ))}
                            </div>
                            <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
                                {release.description}
                            </p>
                        </div>
                    </article>
                ))
            )}
        </HubWidgetCard>
    );
}
