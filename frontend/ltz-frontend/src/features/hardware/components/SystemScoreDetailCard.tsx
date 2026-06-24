/*
 * "LTZ Sistem Skoru" kartı (sağ kolon).
 *
 * Üstte dairesel skor göstergesi (dashboard ile aynı SystemScoreGauge),
 * altında purple/cyan neon progress barlarıyla skor kırılımları.
 */

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import { SystemScoreGauge } from "./SystemScoreGauge";
import type {
    SystemScoreBreakdown,
    SystemScoreBreakdownItem,
} from "../types/hardware.types";

const BAR_TONE_MAP: Record<SystemScoreBreakdownItem["tone"], string> = {
    violet: "from-violet-500 via-fuchsia-500 to-fuchsia-400",
    cyan: "from-cyan-400 via-violet-400 to-violet-500",
    fuchsia: "from-fuchsia-500 via-violet-400 to-cyan-400",
};

const BAR_GLOW_MAP: Record<SystemScoreBreakdownItem["tone"], string> = {
    violet: "rgba(217,70,239,0.6)",
    cyan: "rgba(34,211,238,0.6)",
    fuchsia: "rgba(168,85,247,0.6)",
};

interface SystemScoreDetailCardProps {
    score: SystemScoreBreakdown;
}

export function SystemScoreDetailCard({ score }: SystemScoreDetailCardProps) {
    return (
        <Card className="p-6">
            <HardwarePanelHeader title="LTZ Sistem Skoru" />

            <div className="mt-5 flex flex-col items-center gap-3">
                <SystemScoreGauge score={score.score} max={score.scoreMax} />

                <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Genel Değerlendirme
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-violet-200">
                        {score.tierLabel}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
                {score.breakdown.map((item) => (
                    <div key={item.label}>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300">
                                {item.label}
                            </span>
                            <span className="font-bold tabular-nums text-white">
                                {item.value}%
                            </span>
                        </div>

                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                className={cn(
                                    "h-full rounded-full bg-gradient-to-r",
                                    BAR_TONE_MAP[item.tone],
                                )}
                                style={{
                                    width: `${item.value}%`,
                                    boxShadow: `0 0 12px ${BAR_GLOW_MAP[item.tone]}`,
                                    transition: "width 700ms ease-out",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
