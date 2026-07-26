import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { DealCard } from "../components/deals/DealCard";
import { DealCompareCard } from "../components/deals/DealCompareCard";
import { contentService } from "../services/contentService";
import type { DealCampaign, DealCompareItem } from "../types/deals.types";

const discountFilters = [
    { label: "Tümü", value: 0 },
    { label: "%25+", value: 25 },
    { label: "%50+", value: 50 },
    { label: "%75+", value: 75 },
] as const;

export default function DealsPage() {
    const [deals, setDeals] = useState<DealCampaign[]>([]);
    const [comparisons, setComparisons] = useState<DealCompareItem[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [minDiscount, setMinDiscount] = useState(0);
    const [deckOnly, setDeckOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSearchMode = activeSearch.trim().length > 0;

    useEffect(() => {
        let active = true;

        async function loadDeals() {
            if (isSearchMode) {
                setLoading(true);
                setError(null);

                try {
                    const result = await contentService.searchDeals(activeSearch);
                    if (!active) return;
                    setComparisons(result);
                    setDeals([]);
                } catch (loadError) {
                    if (!active) return;
                    setError(
                        getErrorMessage(
                            loadError,
                            "İndirim araması yapılamadı.",
                        ),
                    );
                } finally {
                    if (active) setLoading(false);
                }
                return;
            }

            const isFirstPage = page === 0;
            if (isFirstPage) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            try {
                const result = await contentService.getDeals({
                    page,
                    size: 12,
                    minDiscount: minDiscount > 0 ? minDiscount : undefined,
                });

                if (!active) return;

                setTotalPages(result.totalPages);
                setDeals((current) =>
                    isFirstPage
                        ? result.content
                        : [...current, ...result.content],
                );
                setComparisons([]);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(loadError, "İndirimler yüklenemedi."),
                );
            } finally {
                if (active) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        }

        void loadDeals();

        return () => {
            active = false;
        };
    }, [activeSearch, isSearchMode, minDiscount, page]);

    const visibleDeals = useMemo(() => {
        if (!deckOnly) return deals;
        return deals.filter(
            (deal) => deal.steamDeckStatus?.toUpperCase() === "VERIFIED",
        );
    }, [deckOnly, deals]);

    function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPage(0);
        setActiveSearch(searchQuery.trim());
    }

    function handleDiscountChange(value: number) {
        setMinDiscount(value);
        setPage(0);
        setActiveSearch("");
        setSearchQuery("");
    }

    return (
        <ContentShell>

            <section className="mb-8">
                <h1 className="text-3xl font-black text-white">İndirimler</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Mağaza fiyatlarını karşılaştır, Steam Deck uyumluluğunu gör
                    ve en yüksek indirimleri yakala.
                </p>
            </section>

            <Card className="mb-6 border-white/10 bg-slate-950/55 p-5">
                <form
                    className="grid gap-4 lg:grid-cols-[1fr_auto]"
                    onSubmit={handleSearchSubmit}
                >
                    <label className="relative block">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Oyun adıyla ara ve mağazaları karşılaştır..."
                            className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50"
                        />
                    </label>

                    <Button type="submit" className="h-12">
                        Ara
                    </Button>
                </form>

                {!isSearchMode ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {discountFilters.map((filter) => (
                            <button
                                key={filter.label}
                                type="button"
                                aria-pressed={minDiscount === filter.value}
                                onClick={() => handleDiscountChange(filter.value)}
                                className={
                                    minDiscount === filter.value
                                        ? "rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-semibold text-fuchsia-100"
                                        : "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-violet-400/30 hover:text-white"
                                }
                            >
                                {filter.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            aria-pressed={deckOnly}
                            onClick={() => setDeckOnly((current) => !current)}
                            className={
                                deckOnly
                                    ? "rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100"
                                    : "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-violet-400/30 hover:text-white"
                            }
                        >
                            Sadece Deck Onaylı
                        </button>
                    </div>
                ) : null}
            </Card>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-72 motion-reduce:animate-none animate-pulse rounded-2xl bg-white/5"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && error ? (
                <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                    {error}
                </Card>
            ) : null}

            {!loading && !error && isSearchMode ? (
                comparisons.length === 0 ? (
                    <ContentEmptyState
                        title="Sonuç bulunamadı"
                        description="Farklı bir oyun adıyla tekrar aramayı dene."
                    />
                ) : (
                    <div className="space-y-4">
                        {comparisons.map((item) => (
                            <DealCompareCard
                                key={item.gameTitle}
                                item={item}
                            />
                        ))}
                    </div>
                )
            ) : null}

            {!loading && !error && !isSearchMode ? (
                visibleDeals.length === 0 ? (
                    <ContentEmptyState
                        title="İndirim bulunamadı"
                        description="Scheduler henüz kampanya doldurmamış olabilir veya filtreler sonuç döndürmüyor."
                    />
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleDeals.map((deal) => (
                                <DealCard key={deal.id} deal={deal} />
                            ))}
                        </div>

                        {page + 1 < totalPages ? (
                            <div className="mt-8 flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    isLoading={loadingMore}
                                    onClick={() => setPage((current) => current + 1)}
                                >
                                    Daha fazla indirim yükle
                                </Button>
                            </div>
                        ) : null}
                    </>
                )
            ) : null}
        </ContentShell>
    );
}
