/*
 * "Oyun Performans Tahmini" kartı.
 *
 * Üstte çözünürlük/preset filtre pill'leri (aktif olanlar neon dolu),
 * altında her oyun için neon horizontal performans barı ve FPS değeri.
 *
 * Filtreler şimdilik görsel; aktiflik dışarıdan activeFilterIds ile
 * kontrol edilir. İleride tıklama ile yeniden tahmin tetiklenebilir.
 */

import { Gamepad2 } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type {
    GamePerformancePrediction,
    PerformanceFilter,
} from "../types/hardware.types";

interface PerformancePredictionCardProps {
    filters: PerformanceFilter[];
    activeFilterIds: string[];
    predictions: GamePerformancePrediction[];
    onFilterToggle?: (filterId: string) => void;
}

/*
 * FPS / hedef FPS oranına göre bar dolgu ve neon renk eşiği.
 * Düşük performans amber, ortası mor, hedefi aşan yeşil/cyan olur.
 */
function resolvePerformance(fps: number, targetFps: number): {
    percent: number;
    barClass: string;
    glow: string;
} {
    const ratio = targetFps > 0 ? fps / targetFps : 0;
    const percent = Math.min(Math.max(ratio, 0), 1) * 100;

    if (ratio < 0.5) {
        return {
            percent,
            barClass: "from-amber-500 to-rose-500",
            glow: "rgba(245,158,11,0.6)",
        };
    }
    if (ratio < 0.85) {
        return {
            percent,
            barClass: "from-violet-500 via-fuchsia-500 to-fuchsia-400",
            glow: "rgba(217,70,239,0.6)",
        };
    }
    return {
        percent,
        barClass: "from-fuchsia-500 via-violet-400 to-cyan-400",
        glow: "rgba(34,211,238,0.6)",
    };
}

export function PerformancePredictionCard({
    filters,
    activeFilterIds,
    predictions,
    onFilterToggle,
}: PerformancePredictionCardProps) {
    const activeSet = new Set(activeFilterIds);

    return (
        <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <HardwarePanelHeader title="Oyun Performans Tahmini" />

                <div className="flex flex-wrap gap-1.5">
                    {filters.map((filter) => {
                        const active = activeSet.has(filter.id);

                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => onFilterToggle?.(filter.id)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200",
                                    active
                                        ? cn(
                                              "border-violet-400/50 bg-violet-500/20 text-white",
                                              "shadow-[0_0_16px_-4px_rgba(139,92,246,0.7)]",
                                          )
                                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-violet-400/30 hover:text-white",
                                )}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                {predictions.map((item) => {
                    const perf = resolvePerformance(item.fps, item.targetFps);

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 rounded-2xl border border-violet-400/15 bg-white/[0.02] p-3 transition-colors hover:border-violet-400/35"
                        >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200">
                                <Gamepad2 size={18} strokeWidth={2.25} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-white">
                                        {item.gameName}
                                    </span>
                                    <span className="shrink-0 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-200">
                                        {item.presetLabel}
                                    </span>
                                </div>

                                {/* Neon performans barı (fps / hedef FPS oranı) */}
                                <div
                                    className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                                    role="progressbar"
                                    aria-valuenow={item.fps}
                                    aria-valuemin={0}
                                    aria-valuemax={item.targetFps}
                                    aria-label={`${item.gameName} performans`}
                                >
                                    <div
                                        className={cn(
                                            "h-full rounded-full bg-gradient-to-r",
                                            perf.barClass,
                                        )}
                                        style={{
                                            width: `${perf.percent}%`,
                                            boxShadow: `0 0 12px ${perf.glow}`,
                                            transition: "width 700ms ease-out",
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className="text-xl font-black tabular-nums text-white">
                                    {item.fps}
                                </span>
                                <span className="ml-1 text-[11px] font-semibold text-slate-400">
                                    FPS
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
