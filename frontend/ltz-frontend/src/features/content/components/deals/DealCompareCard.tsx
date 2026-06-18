import { useState } from "react";
import { ExternalLink, TrendingDown } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";
import type { DealCompareItem } from "../../types/deals.types";
import { normalizeReactions } from "../../utils/reactions";
import { ReactionBar } from "../shared/ReactionBar";
import { SteamDeckBadge } from "./SteamDeckBadge";

interface DealCompareCardProps {
    item: DealCompareItem;
}

export function DealCompareCard({ item }: DealCompareCardProps) {
    const [reactions, setReactions] = useState(item.reactions);
    const [userReaction, setUserReaction] = useState(item.userReaction ?? null);

    const cheapestPrice = item.stores[0]?.discountedPrice;
    const isHistoricalLow =
        item.historicalLow &&
        cheapestPrice !== undefined &&
        cheapestPrice <= item.historicalLow.lowestPrice;

    return (
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">
                        {item.gameTitle}
                    </h3>
                    {isHistoricalLow ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
                            <TrendingDown size={14} />
                            Tarihsel en düşük fiyata yakın — kaçırma!
                        </p>
                    ) : null}
                </div>

                {item.historicalLow ? (
                    <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                        Rekor düşük:{" "}
                        {formatCurrency(
                            item.historicalLow.lowestPrice,
                            item.historicalLow.currency,
                        )}{" "}
                        @ {item.historicalLow.storeName}
                    </div>
                ) : null}
            </div>

            <div className="space-y-3">
                {item.stores.map((store, index) => {
                    const endsLabel = store.endsAt
                        ? formatTimeRemaining(store.endsAt)
                        : null;

                    return (
                        <div
                            key={`${store.storeName}-${store.dealUrl}`}
                            className={
                                index === 0
                                    ? "rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-4"
                                    : "rounded-xl border border-white/10 bg-black/20 p-4"
                            }
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="font-semibold text-white">
                                        {store.storeName}
                                        {index === 0 ? (
                                            <span className="ml-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-200">
                                                En ucuz
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <SteamDeckBadge
                                            status={store.steamDeckStatus}
                                        />
                                        <span className="text-xs text-slate-400">
                                            -{store.discountPercent}%
                                        </span>
                                        {store.crossPlay ? (
                                            <span className="text-xs text-violet-200">
                                                Cross-play
                                            </span>
                                        ) : null}
                                        {store.free ? (
                                            <span className="text-xs font-semibold text-fuchsia-200">
                                                Ücretsiz
                                            </span>
                                        ) : null}
                                        {endsLabel ? (
                                            <span className="text-xs text-amber-200">
                                                {endsLabel}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-lg font-black text-white">
                                            {formatCurrency(
                                                store.discountedPrice,
                                                store.currency,
                                            )}
                                        </div>
                                        {!store.free ? (
                                            <div className="text-xs text-slate-500 line-through">
                                                {formatCurrency(
                                                    store.originalPrice,
                                                    store.currency,
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    <a
                                        href={store.dealUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-400/30 hover:text-white"
                                    >
                                        Git
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {item.campaignId ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Topluluk oyu
                    </p>
                    <ReactionBar
                        contentId={item.campaignId}
                        contentType="CAMPAIGN"
                        reactions={normalizeReactions(reactions)}
                        userReaction={userReaction}
                        onChange={({ reactions: next, userReaction: nextUser }) => {
                            setReactions(next);
                            setUserReaction(nextUser);
                        }}
                    />
                </div>
            ) : null}
        </article>
    );
}
