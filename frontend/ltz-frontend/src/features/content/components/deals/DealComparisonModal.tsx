import { X } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import type { DealCampaign } from "../../types/deals.types";
import { SteamDeckBadge } from "./SteamDeckBadge";

interface DealComparisonModalProps {
    deals: DealCampaign[];
    onClose: () => void;
    onRemove: (dealId: number) => void;
}

export function DealComparisonModal({
    deals,
    onClose,
    onRemove,
}: DealComparisonModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
            <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-950 p-6 sm:rounded-3xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-black text-white">
                        İndirim Karşılaştırma
                    </h2>
                    <button
                        type="button"
                        aria-label="Kapat"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    className="grid gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${deals.length}, minmax(0, 1fr))`,
                    }}
                >
                    {deals.map((deal) => (
                        <div
                            key={deal.id}
                            className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                        >
                            <button
                                type="button"
                                aria-label="Karşılaştırmadan çıkar"
                                onClick={() => onRemove(deal.id)}
                                className="absolute right-2 top-2 rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                            >
                                <X size={14} />
                            </button>

                            <div className="line-clamp-2 pr-6 text-sm font-bold text-white">
                                {deal.gameTitle}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {deal.storeName}
                            </div>

                            <div className="mt-4 text-xl font-black text-fuchsia-300">
                                {deal.free
                                    ? "Ücretsiz"
                                    : formatCurrency(
                                          deal.discountedPrice,
                                          deal.currency,
                                      )}
                            </div>
                            {!deal.free ? (
                                <div className="text-xs text-slate-500 line-through">
                                    {formatCurrency(
                                        deal.originalPrice,
                                        deal.currency,
                                    )}
                                </div>
                            ) : null}
                            <div className="mt-1 text-xs font-bold text-emerald-300">
                                -{deal.discountPercent}%
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-slate-400">
                                <div className="flex items-center justify-between gap-2">
                                    <span>Steam Deck</span>
                                    <SteamDeckBadge status={deal.steamDeckStatus} />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span>Metacritic</span>
                                    <span className="font-semibold text-white">
                                        {deal.metacriticScore ?? "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span>Steam puanı</span>
                                    <span className="font-semibold text-white">
                                        {deal.steamRatingPercent
                                            ? `%${deal.steamRatingPercent}`
                                            : "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span>Cross-play</span>
                                    <span className="font-semibold text-white">
                                        {deal.crossPlay ? "Var" : "Yok"}
                                    </span>
                                </div>
                                {deal.historicalLow ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Rekor düşük</span>
                                        <span className="font-semibold text-white">
                                            {formatCurrency(
                                                deal.historicalLow.lowestPrice,
                                                deal.historicalLow.currency,
                                            )}
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <a
                                href={deal.dealUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 block rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-center text-xs font-semibold text-violet-100 transition hover:bg-violet-500/20"
                            >
                                Mağazaya git
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
