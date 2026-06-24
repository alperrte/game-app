/*
 * "Benim Sistemim" kartı.
 *
 * Sol tarafta donanım özetleri ve ikon tabanlı gaming PC görsel alanı,
 * sağ tarafta circular system score göstergesi ve uyumluluk rozetleri.
 */

import {
    Cpu,
    HardDrive,
    MemoryStick,
    MonitorCog,
    RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import { SystemScoreGauge } from "./SystemScoreGauge";
import type { MySystemOverview, SystemSpec } from "../types/hardware.types";

const SPEC_ICON_MAP: Record<SystemSpec["icon"], LucideIcon> = {
    gpu: MonitorCog,
    cpu: Cpu,
    ram: MemoryStick,
    storage: HardDrive,
};

const BADGE_TONE_MAP: Record<string, string> = {
    violet: "border-violet-400/40 bg-violet-500/10 text-violet-200",
    cyan: "border-cyan-300/40 bg-cyan-400/10 text-cyan-200",
    fuchsia: "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200",
};

interface MySystemOverviewCardProps {
    system: MySystemOverview;
    onUpdate?: () => void;
}

export function MySystemOverviewCard({
    system,
    onUpdate,
}: MySystemOverviewCardProps) {
    return (
        <Card className="p-6">
            <HardwarePanelHeader title="Benim Sistemim" />

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Sol: donanım özetleri */}
                <div className="grid grid-cols-2 gap-3">
                    {system.specs.map((spec) => {
                        const Icon = SPEC_ICON_MAP[spec.icon];

                        return (
                            <div
                                key={spec.label}
                                className={cn(
                                    "rounded-2xl border border-violet-400/20 bg-white/[0.03] p-4",
                                    "transition-colors hover:border-violet-400/40",
                                )}
                            >
                                <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200">
                                    <Icon size={18} strokeWidth={2.25} />
                                </span>

                                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    {spec.label}
                                </div>
                                <div className="mt-0.5 text-sm font-semibold text-white">
                                    {spec.value}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sağ: system score + tier */}
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-violet-400/20 bg-white/[0.02] p-5">
                    <SystemScoreGauge
                        score={system.score}
                        max={system.scoreMax}
                    />

                    <div className="text-center">
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Sistem Skoru
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-violet-200">
                            {system.tierLabel}
                        </div>
                    </div>
                </div>
            </div>

            {/* Uyumluluk rozetleri */}
            <div className="mt-5 flex flex-wrap gap-2">
                {system.compatibility.map((badge) => (
                    <span
                        key={badge.label}
                        className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-semibold",
                            BADGE_TONE_MAP[badge.tone] ?? BADGE_TONE_MAP.violet,
                        )}
                    >
                        {badge.label}
                    </span>
                ))}
            </div>

            <button
                type="button"
                onClick={onUpdate}
                className={cn(
                    "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                    "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 text-sm font-semibold text-white",
                    "shadow-[0_0_28px_rgba(147,51,234,0.45)] transition-all duration-200",
                    "hover:shadow-[0_0_40px_rgba(217,70,239,0.6)] hover:scale-[1.01]",
                )}
            >
                <RefreshCw size={16} />
                Sistemi Güncelle
            </button>
        </Card>
    );
}
