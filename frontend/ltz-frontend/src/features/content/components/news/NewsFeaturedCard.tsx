import { ExternalLink } from "lucide-react";

import { cn } from "../../../../utils/cn";
import type { NewsArticle } from "../../types/news.types";
import { NEWS_CATEGORY_LABELS, formatNewsDate } from "../../utils/newsFormatting";
import { normalizeReactions } from "../../utils/reactions";
import { ReactionBar } from "../shared/ReactionBar";

interface NewsFeaturedCardProps {
    article: NewsArticle;
    onReactionChange?: (article: NewsArticle) => void;
}

export function NewsFeaturedCard({
    article,
    onReactionChange,
}: NewsFeaturedCardProps) {
    return (
        <article className="overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-slate-950/90 via-violet-950/30 to-slate-950/90 shadow-[0_0_40px_rgba(124,58,237,0.12)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                {article.imageUrl ? (
                    <div className="relative min-h-[220px] overflow-hidden lg:min-h-[320px]">
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-slate-950/90" />
                    </div>
                ) : null}

                <div className="space-y-4 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-fuchsia-400/35 bg-fuchsia-500/15 px-2.5 py-1 font-bold uppercase tracking-[0.14em] text-fuchsia-100">
                            Öne Çıkan
                        </span>
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 font-bold uppercase tracking-[0.14em] text-violet-100">
                            {NEWS_CATEGORY_LABELS[article.category]}
                        </span>
                        <span className="text-slate-500">
                            {article.sourceName} ·{" "}
                            {formatNewsDate(article.createdAt, "long")}
                        </span>
                    </div>

                    <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                        {article.title}
                    </h2>

                    {article.summary ? (
                        <p className="line-clamp-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                            {article.summary}
                        </p>
                    ) : null}

                    <a
                        href={article.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                            "inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-300 transition hover:text-fuchsia-200",
                        )}
                    >
                        Haberin kaynağına git
                        <ExternalLink size={15} />
                    </a>

                    <ReactionBar
                        contentId={article.id}
                        contentType="NEWS"
                        reactions={normalizeReactions(article.reactions)}
                        userReaction={article.userReaction}
                        onChange={({ reactions, userReaction }) =>
                            onReactionChange?.({
                                ...article,
                                reactions,
                                userReaction,
                            })
                        }
                    />
                </div>
            </div>
        </article>
    );
}
