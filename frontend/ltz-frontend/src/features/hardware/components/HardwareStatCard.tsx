/*
 * Tek bir özet istatistik kartı.
 *
 * Sol tarafta neon ikon, büyük sayı, küçük uppercase label ve
 * sağ üstte trend rozeti bulunur. tone değerine göre mor/cyan glow alır.
 */

import { Activity, Cpu, Layers, Tag, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../../utils/cn";
import { Sparkline } from "./Sparkline";
import type { HardwareStat } from "../types/hardware.types";

const ICON_MAP: Record<HardwareStat["icon"], LucideIcon> = {
    cpu: Cpu,
    activity: Activity,
    tag: Tag,
    layers: Layers,
};

const TONE_MAP: Record<
    HardwareStat["tone"],
    { glow: string; iconBox: string; spark: string }
> = {
    violet: {
        glow: "hover:shadow-[0_0_44px_rgba(124,58,237,0.5)]",
        iconBox: "border-violet-400/40 bg-violet-500/15 text-violet-200",
        spark: "#a78bfa",
    },
    purple: {
        glow: "hover:shadow-[0_0_44px_rgba(147,51,234,0.5)]",
        iconBox: "border-purple-400/40 bg-purple-500/15 text-purple-200",
        spark: "#c084fc",
    },
    fuchsia: {
        glow: "hover:shadow-[0_0_44px_rgba(217,70,239,0.5)]",
        iconBox: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200",
        spark: "#e879f9",
    },
    cyan: {
        glow: "hover:shadow-[0_0_44px_rgba(34,211,238,0.5)]",
        iconBox: "border-cyan-300/40 bg-cyan-400/15 text-cyan-200",
        spark: "#22d3ee",
    },
};

interface HardwareStatCardProps {
    stat: HardwareStat;
}

export function HardwareStatCard({ stat }: HardwareStatCardProps) {
    const Icon = ICON_MAP[stat.icon];
    const tone = TONE_MAP[stat.tone];
    const up = stat.trendDirection === "up";
    const TrendIcon = up ? TrendingUp : TrendingDown;

    return (
        <div
            className={cn(
                "group rounded-2xl border border-violet-400/25 bg-ltz-panel/70 p-5 backdrop-blur-xl",
                "transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/50",
                tone.glow,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-xl border",
                        tone.iconBox,
                    )}
                >
                    <Icon size={22} strokeWidth={2.25} />
                </span>

                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        up
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-400/30 bg-rose-500/10 text-rose-300",
                    )}
                >
                    <TrendIcon size={11} />
                    {stat.trendLabel}
                </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                    <div className="text-3xl font-black text-white">
                        {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {stat.label}
                    </div>
                </div>

                <div className="shrink-0 opacity-80 transition-opacity duration-200 group-hover:opacity-100">
                    <Sparkline data={stat.trendData} stroke={tone.spark} />
                </div>
            </div>
        </div>
    );
}
