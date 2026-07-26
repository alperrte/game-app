import { useState } from "react";
import { Bookmark, CheckCircle2, ExternalLink } from "lucide-react";

import { cn } from "../../../../utils/cn";
import type { NewsArticle } from "../../types/news.types";
import { NEWS_CATEGORY_LABELS, formatNewsDate } from "../../utils/newsFormatting";
import { normalizeReactions } from "../../utils/reactions";
import { isNewsVisited, markNewsVisited } from "../../utils/visitedNews";
import { isNewsBookmarked, toggleNewsBookmark } from "../../utils/bookmarkedNews";
import { CopyLinkButton } from "../shared/CopyLinkButton";
import { ReactionBar } from "../shared/ReactionBar";
import { ShareToFeedButton } from "../shared/ShareToFeedButton";

interface NewsCardProps {
    article: NewsArticle;
    onReactionChange?: (article: NewsArticle) => void;
}

export function NewsCard({ article, onReactionChange }: NewsCardProps) {
    const [visited, setVisited] = useState(() => isNewsVisited(article.id));
    const [bookmarked, setBookmarked] = useState(() =>
        isNewsBookmarked(article.id),
    );

    return (
        <article
            className={cn(
                "overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-violet-400/25",
                visited && "opacity-70",
            )}
        >
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
                    <h3 className="flex items-start gap-2 text-lg font-bold text-white">
                        <span>{article.title}</span>
                        {visited ? (
                            <CheckCircle2
                                size={16}
                                className="mt-1 shrink-0 text-slate-500"
                                aria-label="Okundu"
                            />
                        ) : null}
                    </h3>
                    {article.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
                            {article.summary}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href={article.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                            markNewsVisited(article.id);
                            setVisited(true);
                        }}
                        className={cn(
                            "inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-300 transition hover:text-fuchsia-200",
                        )}
                    >
                        Haberin kaynağına git
                        <ExternalLink size={15} />
                    </a>
                    <CopyLinkButton url={article.contentUrl} />
                    <ShareToFeedButton
                        content={`${article.title}\n\n${article.contentUrl}`}
                        imageUrl={article.imageUrl}
                    />
                    <button
                        type="button"
                        aria-label={
                            bookmarked
                                ? "Sonra oku listesinden çıkar"
                                : "Sonra oku listesine ekle"
                        }
                        aria-pressed={bookmarked}
                        onClick={() =>
                            setBookmarked(
                                toggleNewsBookmark({
                                    id: article.id,
                                    title: article.title,
                                    contentUrl: article.contentUrl,
                                    imageUrl: article.imageUrl,
                                    sourceName: article.sourceName,
                                }),
                            )
                        }
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition",
                            bookmarked
                                ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                        )}
                    >
                        <Bookmark size={13} fill={bookmarked ? "currentColor" : "none"} />
                        {bookmarked ? "Kaydedildi" : "Sonra oku"}
                    </button>
                </div>

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
