/*
 * "Önerilen Yükseltmeler" kartı (sağ kolon).
 *
 * Her öneri başlık + açıklama + öncelik rozeti içerir. Öncelik renkleri
 * LTZ tonuna uygun: Yüksek (turuncu), Orta (cyan), Düşük (mor/gri).
 */

import { ArrowUpCircle } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type {
    UpgradePriority,
    UpgradeRecommendation,
} from "../types/hardware.types";

const PRIORITY_META: Record<
    UpgradePriority,
    { label: string; className: string }
> = {
    high: {
        label: "Yüksek",
        className: "border-orange-400/40 bg-orange-500/10 text-orange-200",
    },
    medium: {
        label: "Orta",
        className: "border-cyan-300/40 bg-cyan-400/10 text-cyan-200",
    },
    low: {
        label: "Düşük",
        className: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    },
};

interface RecommendedUpgradesCardProps {
    upgrades: UpgradeRecommendation[];
}

export function RecommendedUpgradesCard({
    upgrades,
}: RecommendedUpgradesCardProps) {
    return (
        <Card className="p-6">
            <HardwarePanelHeader title="Önerilen Yükseltmeler" />

            <div className="mt-5 flex flex-col gap-3">
                {upgrades.map((upgrade) => {
                    const meta = PRIORITY_META[upgrade.priority];

                    return (
                        <div
                            key={upgrade.id}
                            className="rounded-2xl border border-violet-400/15 bg-white/[0.02] p-4 transition-colors hover:border-violet-400/35"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200">
                                        <ArrowUpCircle size={17} strokeWidth={2.25} />
                                    </span>
                                    <span className="text-sm font-bold text-white">
                                        {upgrade.title}
                                    </span>
                                </div>

                                <span
                                    className={cn(
                                        "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                        meta.className,
                                    )}
                                >
                                    {meta.label}
                                </span>
                            </div>

                            <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                                {upgrade.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
