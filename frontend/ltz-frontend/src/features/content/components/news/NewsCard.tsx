import { ExternalLink } from "lucide-react";

import { cn } from "../../../../utils/cn";
import type { NewsArticle } from "../../types/news.types";
import { NEWS_CATEGORY_LABELS, formatNewsDate } from "../../utils/newsFormatting";
import { normalizeReactions } from "../../utils/reactions";
import { ReactionBar } from "../shared/ReactionBar";

interface NewsCardProps {
    article: NewsArticle;
    onReactionChange?: (article: NewsArticle) => void;
}

export function NewsCard({ article, onReactionChange }: NewsCardProps) {
    return (
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-violet-400/25">
            {article.imageUrl ? (
                <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="aspect-[21/9] w-full object-cover"
                />
            ) : null}

            <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 font-bold uppercase tracking-[0.14em] text-violet-100">
                        {NEWS_CATEGORY_LABELS[article.category]}
                    </span>
                    <span className="text-slate-500">{article.sourceName}</span>
                    <span className="text-slate-500">
                        {formatNewsDate(article.createdAt)}
                    </span>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white">
                        {article.title}
                    </h3>
                    {article.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
                            {article.summary}
                        </p>
                    ) : null}
                </div>

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
        </article>
    );
}
