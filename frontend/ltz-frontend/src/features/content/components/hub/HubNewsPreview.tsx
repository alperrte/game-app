import { ExternalLink, Newspaper } from "lucide-react";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { NewsArticle, NewsCategory } from "../../types/news.types";
import { formatNewsDate } from "../../utils/newsFormatting";
import { HubWidgetCard } from "./HubWidgetCard";

const categoryLabels: Record<NewsCategory, string> = {
    GLOBAL: "Genel",
    HARDWARE: "Donanım",
    PATCH_NOTES: "Yama",
};

interface HubNewsPreviewProps {
    articles: NewsArticle[];
}

export function HubNewsPreview({ articles }: HubNewsPreviewProps) {
    const [featured, ...rest] = articles;

    return (
        <HubWidgetCard
            title="Son Haberler"
            subtitle="RSS kaynaklarından canlı akış"
            icon={Newspaper}
            action={{ label: "Tümünü gör", href: CONTENT_ROUTES.news }}
            contentClassName="space-y-3"
        >
            {articles.length === 0 ? (
                <p className="text-sm text-slate-400">
                    Henüz haber yüklenmedi. News scheduler bir sonraki döngüde
                    güncelleyecek.
                </p>
            ) : (
                <>
                    {featured ? (
                        <a
                            href={featured.contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group block overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-violet-400/30"
                        >
                            {featured.imageUrl ? (
                                <div className="relative aspect-[21/9] overflow-hidden">
                                    <img
                                        src={featured.imageUrl}
                                        alt={featured.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                                </div>
                            ) : null}

                            <div className="space-y-2 p-4">
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-violet-100">
                                        {categoryLabels[featured.category]}
                                    </span>
                                    <span>{featured.sourceName}</span>
                                    <span>{formatNewsDate(featured.createdAt)}</span>
                                </div>
                                <h4 className="line-clamp-2 text-sm font-bold text-white group-hover:text-fuchsia-200">
                                    {featured.title}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
                                    Kaynağa git
                                    <ExternalLink size={12} />
                                </span>
                            </div>
                        </a>
                    ) : null}

                    {rest.slice(0, 3).map((article) => (
                        <a
                            key={article.id}
                            href={article.contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 transition hover:border-violet-400/25 hover:bg-white/[0.02]"
                        >
                            {article.imageUrl ? (
                                <img
                                    src={article.imageUrl}
                                    alt=""
                                    loading="lazy"
                                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg border border-white/10 bg-violet-500/10 text-[10px] font-bold text-violet-200">
                                    RSS
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-slate-500">
                                    {article.sourceName} ·{" "}
                                    {formatNewsDate(article.createdAt)}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-white group-hover:text-fuchsia-200">
                                    {article.title}
                                </div>
                            </div>
                        </a>
                    ))}
                </>
            )}
        </HubWidgetCard>
    );
}
