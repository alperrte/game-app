import { Percent } from "lucide-react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { DealCampaign } from "../../types/deals.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface HubDealsPreviewProps {
    deals: DealCampaign[];
}

export function HubDealsPreview({ deals }: HubDealsPreviewProps) {
    return (
        <HubWidgetCard
            title="Günün İndirimleri"
            subtitle="CheapShark üzerinden canlı fiyatlar"
            icon={Percent}
            action={{ label: "Tümünü gör", href: CONTENT_ROUTES.deals }}
            contentClassName="grid gap-3 sm:grid-cols-2"
        >
            {deals.length === 0 ? (
                <p className="text-sm text-slate-400 sm:col-span-2">
                    Aktif indirim kampanyası bulunamadı.
                </p>
            ) : (
                deals.slice(0, 4).map((deal) => (
                    <a
                        key={deal.id}
                        href={deal.dealUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-fuchsia-400/30 hover:bg-white/[0.02]"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden bg-violet-500/5">
                            {deal.imageUrl ? (
                                <img
                                    src={deal.imageUrl}
                                    alt={deal.gameTitle}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="grid h-full place-items-center px-3 text-center text-xs font-bold text-violet-200">
                                    {deal.gameTitle}
                                </div>
                            )}
                            <span className="absolute left-2 top-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/25 px-2 py-0.5 text-[10px] font-black text-fuchsia-100">
                                {deal.free
                                    ? "ÜCRETSİZ"
                                    : `-${deal.discountPercent}%`}
                            </span>
                        </div>

                        <div className="space-y-1 p-3">
                            <div className="line-clamp-2 text-sm font-bold text-white group-hover:text-fuchsia-200">
                                {deal.gameTitle}
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-slate-500">
                                    {deal.storeName}
                                </span>
                                <span className="font-bold text-violet-200">
                                    {formatCurrency(
                                        deal.discountedPrice,
                                        deal.currency,
                                    )}
                                </span>
                            </div>
                        </div>
                    </a>
                ))
            )}
        </HubWidgetCard>
    );
}
