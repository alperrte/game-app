import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Newspaper, Search } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cn } from "../../../utils/cn";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { NewsCard } from "../components/news/NewsCard";
import { NewsFeaturedCard } from "../components/news/NewsFeaturedCard";
import { ChipScrollRow } from "../components/shared/ChipScrollRow";
import { contentService } from "../services/contentService";
import { getBookmarkedNews } from "../utils/bookmarkedNews";
import type { NewsArticle, NewsCategory } from "../types/news.types";

const categories: Array<{ label: string; value?: NewsCategory }> = [
    { label: "Tümü" },
    { label: "Genel", value: "GLOBAL" },
    { label: "Donanım", value: "HARDWARE" },
    { label: "Yama Notları", value: "PATCH_NOTES" },
];

export default function NewsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = (searchParams.get("category") as NewsCategory | null) ?? undefined;
    const source = searchParams.get("source") ?? undefined;
    const page = Number(searchParams.get("page") ?? "0") || 0;
    const searchQuery = searchParams.get("q") ?? "";
    const showBookmarksOnly = searchParams.get("saved") === "1";

    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookmarkedArticles, setBookmarkedArticles] = useState(() =>
        getBookmarkedNews(),
    );

    function handleToggleBookmarksOnly() {
        if (!showBookmarksOnly) {
            setBookmarkedArticles(getBookmarkedNews());
        }
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (showBookmarksOnly) params.delete("saved");
            else params.set("saved", "1");
            return params;
        });
    }

    useEffect(() => {
        let active = true;

        contentService
            .getNewsSources()
            .then((result) => {
                if (active) setSources(result);
            })
            .catch(() => {
                if (active) setSources([]);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadNews() {
            const isFirstPage = page === 0;
            if (isFirstPage) setLoading(true);
            else setLoadingMore(true);
            setError(null);

            try {
                const result = await contentService.getNews({
                    page,
                    size: 10,
                    category,
                    source,
                });

                if (!active) return;

                setArticles((current) =>
                    isFirstPage
                        ? result.content
                        : [...current, ...result.content],
                );
                setHasMore(!result.last);
            } catch (loadError) {
                if (!active) return;
                setError(getErrorMessage(loadError, "Haberler yüklenemedi."));
            } finally {
                if (active) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        }

        void loadNews();

        return () => {
            active = false;
        };
    }, [category, source, page]);

    const filteredArticles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return articles;
        return articles.filter((article) =>
            article.title.toLowerCase().includes(q),
        );
    }, [articles, searchQuery]);

    const featuredArticle = useMemo(
        () =>
            page === 0 && !category && !source && !searchQuery.trim()
                ? filteredArticles[0]
                : undefined,
        [filteredArticles, category, source, page, searchQuery],
    );

    const listArticles = useMemo(
        () =>
            featuredArticle
                ? filteredArticles.filter((a) => a.id !== featuredArticle.id)
                : filteredArticles,
        [filteredArticles, featuredArticle],
    );

    function handleSearchChange(value: string) {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (value.trim()) params.set("q", value);
            else params.delete("q");
            return params;
        });
    }

    function handleCategoryChange(next?: NewsCategory) {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (next) params.set("category", next);
            else params.delete("category");
            params.delete("page");
            return params;
        });
    }

    function handleSourceChange(next?: string) {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (next) params.set("source", next);
            else params.delete("source");
            params.delete("page");
            return params;
        });
    }

    function handleArticleUpdate(updated: NewsArticle) {
        setArticles((current) =>
            current.map((article) =>
                article.id === updated.id ? updated : article,
            ),
        );
    }

    return (
        <ContentShell>
            <section className="mb-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-black text-white">
                            Haberler
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-400">
                            Oyun dünyasından güncel başlıklar, kaynak linkleri
                            ve topluluk reaksiyonları.
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-pressed={showBookmarksOnly}
                        onClick={handleToggleBookmarksOnly}
                        className={cn(
                            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                            showBookmarksOnly
                                ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                        )}
                    >
                        <Bookmark size={14} fill={showBookmarksOnly ? "currentColor" : "none"} />
                        Kaydedilenler ({bookmarkedArticles.length})
                    </button>
                </div>
            </section>

            {showBookmarksOnly ? (
                <div className="space-y-4">
                    {bookmarkedArticles.length === 0 ? (
                        <ContentEmptyState
                            icon={Bookmark}
                            title="Kaydedilen haber yok"
                            description="Bir haberdeki 'Sonra oku' butonuna basarsan burada birikir."
                        />
                    ) : (
                        bookmarkedArticles.map((saved) => (
                            <a
                                key={saved.id}
                                href={saved.contentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-violet-400/25"
                            >
                                {saved.imageUrl ? (
                                    <img
                                        src={saved.imageUrl}
                                        alt=""
                                        loading="lazy"
                                        className="h-16 w-24 shrink-0 rounded-lg object-cover"
                                    />
                                ) : null}
                                <div className="min-w-0">
                                    <div className="truncate text-xs text-slate-500">
                                        {saved.sourceName}
                                    </div>
                                    <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-white">
                                        {saved.title}
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            ) : (
                <>
            <label className="relative mb-4 block">
                <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Yüklenen haberlerde başlığa göre ara..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50"
                />
            </label>

            <ChipScrollRow className="mb-3">
                {categories.map((item) => {
                    const active = category === item.value;

                    return (
                        <button
                            key={item.label}
                            type="button"
                            aria-pressed={active}
                            onClick={() => handleCategoryChange(item.value)}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                active
                                    ? "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100"
                                    : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </ChipScrollRow>

            {sources.length > 0 ? (
                <ChipScrollRow className="mb-6">
                    <button
                        type="button"
                        aria-pressed={!source}
                        onClick={() => handleSourceChange(undefined)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            !source
                                ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                        )}
                    >
                        Tüm kaynaklar
                    </button>
                    {sources.map((item) => {
                        const active = source === item;

                        return (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={active}
                                onClick={() => handleSourceChange(item)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                    active
                                        ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                        : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white",
                                )}
                            >
                                {item}
                            </button>
                        );
                    })}
                </ChipScrollRow>
            ) : null}

            {loading ? (
                <div className="space-y-4">
                    <div className="h-72 motion-reduce:animate-none animate-pulse rounded-3xl bg-white/5" />
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-48 motion-reduce:animate-none animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            <AnimatePresence mode="wait">
                {!loading && !error ? (
                    <motion.div
                        key={`${category ?? "all"}-${source ?? "all"}-${searchQuery}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {filteredArticles.length === 0 ? (
                            <ContentEmptyState
                                icon={Newspaper}
                                title="Haber bulunamadı"
                                description={
                                    searchQuery.trim()
                                        ? "Yüklenen haberler arasında bu başlıkla eşleşen bulunamadı."
                                        : "RSS scheduler henüz yeni içerik çekmemiş olabilir."
                                }
                            />
                        ) : (
                            <div className="space-y-6">
                                {featuredArticle ? (
                                    <NewsFeaturedCard
                                        article={featuredArticle}
                                        onReactionChange={handleArticleUpdate}
                                    />
                                ) : null}

                                <div className="space-y-4">
                                    {listArticles.map((article) => (
                                        <NewsCard
                                            key={article.id}
                                            article={article}
                                            onReactionChange={handleArticleUpdate}
                                        />
                                    ))}
                                </div>

                                {hasMore ? (
                                    <div className="flex justify-center pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            isLoading={loadingMore}
                                            onClick={() =>
                                                setSearchParams((prev) => {
                                                    const params = new URLSearchParams(prev);
                                                    params.set("page", String(page + 1));
                                                    return params;
                                                })
                                            }
                                        >
                                            Daha fazla haber yükle
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>
                </>
            )}
        </ContentShell>
    );
}
