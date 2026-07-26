import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cn } from "../../../utils/cn";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { NewsCard } from "../components/news/NewsCard";
import { NewsFeaturedCard } from "../components/news/NewsFeaturedCard";
import { contentService } from "../services/contentService";
import type { NewsArticle, NewsCategory } from "../types/news.types";

const categories: Array<{ label: string; value?: NewsCategory }> = [
    { label: "Tümü" },
    { label: "Genel", value: "GLOBAL" },
    { label: "Donanım", value: "HARDWARE" },
    { label: "Yama Notları", value: "PATCH_NOTES" },
];

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [category, setCategory] = useState<NewsCategory | undefined>();
    const [sources, setSources] = useState<string[]>([]);
    const [source, setSource] = useState<string | undefined>();
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const featuredArticle = useMemo(
        () => (page === 0 && !category && !source ? articles[0] : undefined),
        [articles, category, source, page],
    );

    const listArticles = useMemo(
        () =>
            featuredArticle
                ? articles.filter((a) => a.id !== featuredArticle.id)
                : articles,
        [articles, featuredArticle],
    );

    function handleCategoryChange(next?: NewsCategory) {
        setCategory(next);
        setPage(0);
    }

    function handleSourceChange(next?: string) {
        setSource(next);
        setPage(0);
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
                <h1 className="text-3xl font-black text-white">Haberler</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Oyun dünyasından güncel başlıklar, kaynak linkleri ve
                    topluluk reaksiyonları.
                </p>
            </section>

            <div className="mb-3 flex flex-wrap gap-2">
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
            </div>

            {sources.length > 0 ? (
                <div className="mb-6 flex flex-wrap gap-2">
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
                </div>
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

            {!loading && !error && articles.length === 0 ? (
                <ContentEmptyState
                    title="Haber bulunamadı"
                    description="RSS scheduler henüz yeni içerik çekmemiş olabilir."
                />
            ) : null}

            {!loading && !error && articles.length > 0 ? (
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
                                    setPage((current) => current + 1)
                                }
                            >
                                Daha fazla haber yükle
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </ContentShell>
    );
}
