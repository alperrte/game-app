/*
 * "Eksik Bilgiler" kartı (sağ kolon).
 *
 * Eksik alanları net gösterir ama agresif kırmızı yerine LTZ'nin
 * amber/mor tonunu kullanır. Altta "Eksikleri Tamamla" CTA'sı bulunur.
 */

import { AlertTriangle, Circle, ChevronRight } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type { MissingHardwareInfo } from "../types/hardware.types";

interface MissingHardwareInfoCardProps {
    missing: MissingHardwareInfo;
    onComplete?: () => void;
}

export function MissingHardwareInfoCard({
    missing,
    onComplete,
}: MissingHardwareInfoCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
                <HardwarePanelHeader title="Eksik Bilgiler" />

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-200">
                    <AlertTriangle size={13} />
                    {missing.count} Eksik
                </span>
            </div>

            <ul className="mt-5 flex flex-col gap-2">
                {missing.items.map((item) => (
                    <li
                        key={item}
                        className="flex items-center gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2.5"
                    >
                        <Circle size={14} className="shrink-0 text-amber-300/70" />
                        <span className="text-sm font-semibold text-slate-200">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                onClick={onComplete}
                className={cn(
                    "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                    "border border-violet-400/30 bg-white/[0.04] text-sm font-semibold text-slate-200 backdrop-blur-sm",
                    "transition-all duration-200 hover:border-violet-400/60 hover:bg-white/[0.08] hover:text-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                )}
            >
                Eksikleri Tamamla
                <ChevronRight size={16} />
            </button>
        </Card>
    );
}
