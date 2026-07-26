import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ContentEmptyState } from "../components/ContentEmptyState";
import { ContentShell } from "../components/ContentShell";
import { DealCard } from "../components/deals/DealCard";
import { DealCompareCard } from "../components/deals/DealCompareCard";
import { DealComparisonModal } from "../components/deals/DealComparisonModal";
import { ChipScrollRow } from "../components/shared/ChipScrollRow";
import { contentService } from "../services/contentService";
import type { DealCampaign, DealCompareItem } from "../types/deals.types";

const discountFilters = [
    { label: "Tümü", value: 0 },
    { label: "%25+", value: 25 },
    { label: "%50+", value: 50 },
    { label: "%75+", value: 75 },
] as const;

export default function DealsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get("page") ?? "0") || 0;
    const minDiscount = Number(searchParams.get("minDiscount") ?? "0") || 0;
    const deckOnly = searchParams.get("deckOnly") === "1";
    const activeSearch = searchParams.get("q") ?? "";

    const [deals, setDeals] = useState<DealCampaign[]>([]);
    const [comparisons, setComparisons] = useState<DealCompareItem[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState(activeSearch);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [compareIds, setCompareIds] = useState<number[]>([]);
    const [compareOpen, setCompareOpen] = useState(false);

    const isSearchMode = activeSearch.trim().length > 0;

    const MAX_COMPARE = 3;

    function handleToggleCompare(dealId: number) {
        setCompareIds((current) => {
            if (current.includes(dealId)) {
                return current.filter((id) => id !== dealId);
            }
            if (current.length >= MAX_COMPARE) return current;
            return [...current, dealId];
        });
    }

    const compareDeals = deals.filter((deal) => compareIds.includes(deal.id));

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
        const trimmed = searchQuery.trim();
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.delete("page");
            if (trimmed) params.set("q", trimmed);
            else params.delete("q");
            return params;
        });
    }

    function handleDiscountChange(value: number) {
        setSearchQuery("");
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.delete("page");
            params.delete("q");
            if (value > 0) params.set("minDiscount", String(value));
            else params.delete("minDiscount");
            return params;
        });
    }

    function handleDeckOnlyToggle() {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (deckOnly) params.delete("deckOnly");
            else params.set("deckOnly", "1");
            return params;
        });
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
                    <ChipScrollRow className="mt-4">
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
                            onClick={handleDeckOnlyToggle}
                            className={
                                deckOnly
                                    ? "rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100"
                                    : "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-violet-400/30 hover:text-white"
                            }
                        >
                            Sadece Deck Onaylı
                        </button>
                    </ChipScrollRow>
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

            <AnimatePresence mode="wait">
                {!loading && !error ? (
                    <motion.div
                        key={
                            isSearchMode
                                ? `search-${activeSearch}`
                                : `browse-${minDiscount}-${deckOnly}`
                        }
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {isSearchMode ? (
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
                        ) : (
                            <>
                                {visibleDeals.length === 0 ? (
                                    <ContentEmptyState
                                        title="İndirim bulunamadı"
                                        description={
                                            deckOnly && deals.length > 0
                                                ? "Yüklenen sayfada Deck onaylı indirim yok. Daha fazla yükleyip tekrar dene."
                                                : "Scheduler henüz kampanya doldurmamış olabilir veya filtreler sonuç döndürmüyor."
                                        }
                                    />
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {visibleDeals.map((deal) => (
                                            <DealCard
                                                key={deal.id}
                                                deal={deal}
                                                compareSelected={compareIds.includes(deal.id)}
                                                onToggleCompare={() =>
                                                    handleToggleCompare(deal.id)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}

                                {page + 1 < totalPages ? (
                                    <div className="mt-8 flex justify-center">
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
                                            Daha fazla indirim yükle
                                        </Button>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {compareIds.length > 0 && !compareOpen ? (
                <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-violet-400/30 bg-slate-950/95 px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur">
                    <span className="text-sm font-semibold text-white">
                        {compareIds.length} oyun seçildi
                    </span>
                    <Button
                        type="button"
                        onClick={() => setCompareOpen(true)}
                        disabled={compareIds.length < 2}
                    >
                        Karşılaştır
                    </Button>
                    <button
                        type="button"
                        aria-label="Seçimi temizle"
                        onClick={() => setCompareIds([])}
                        className="text-xs font-semibold text-slate-400 hover:text-white"
                    >
                        Temizle
                    </button>
                </div>
            ) : null}

            {compareOpen && compareDeals.length > 0 ? (
                <DealComparisonModal
                    deals={compareDeals}
                    onClose={() => setCompareOpen(false)}
                    onRemove={(dealId) =>
                        setCompareIds((current) =>
                            current.filter((id) => id !== dealId),
                        )
                    }
                />
            ) : null}
        </ContentShell>
    );
}
