/*
 * "Popüler Kampanyalar" kartı.
 * Her ürün için koyu neon placeholder görsel, fiyat karşılaştırması,
 * indirim rozeti ve detay butonu içerir.
 */

import { ChevronRight, Cpu } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type { HardwareDeal } from "../types/hardware.types";

interface HardwareDealsCardProps {
    deals: HardwareDeal[];
    onViewAll?: () => void;
    onDealDetail?: (deal: HardwareDeal) => void;
}

export function HardwareDealsCard({
    deals,
    onViewAll,
    onDealDetail,
}: HardwareDealsCardProps) {
    return (
        <Card className="p-5">
            <HardwarePanelHeader
                title="Popüler Kampanyalar"
                actionLabel="Tümünü Gör"
                onAction={onViewAll}
            />

            <div className="mt-4 flex flex-col gap-3">
                {deals.map((deal) => (
                    <div
                        key={deal.id}
                        className="flex items-center gap-3 rounded-2xl border border-violet-400/15 bg-white/[0.02] p-3"
                    >
                        {/* Koyu neon placeholder görsel */}
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 text-violet-200">
                            <Cpu size={20} strokeWidth={2.25} />
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white">
                                {deal.name}
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-slate-500 line-through">
                                    {deal.oldPrice}
                                </span>
                                <span className="text-sm font-bold text-cyan-300">
                                    {deal.newPrice}
                                </span>
                                <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-200">
                                    {deal.discountLabel}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onDealDetail?.(deal)}
                            aria-label={`${deal.name} detayını gör`}
                            className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400",
                                "transition-colors hover:border-violet-400/40 hover:text-white",
                            )}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
}
