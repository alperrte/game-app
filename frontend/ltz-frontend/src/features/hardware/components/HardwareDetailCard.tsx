/*
 * Düzenlenebilir tek bir donanım bileşeni kartı.
 *
 * Bilgi eklenmişse marka + bileşen adı + teknik özellikler gösterilir.
 * Eklenmemişse "Bilgi Eklenmedi" durumu ve "Ekle" çağrısı gösterilir.
 */

import {
    CircuitBoard,
    Cpu,
    HardDrive,
    MemoryStick,
    MonitorCog,
    PencilLine,
    Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../../utils/cn";
import type {
    HardwareComponent,
    HardwareComponentCategory,
} from "../types/hardware.types";

const CATEGORY_ICON_MAP: Record<HardwareComponentCategory, LucideIcon> = {
    gpu: MonitorCog,
    cpu: Cpu,
    ram: MemoryStick,
    storage: HardDrive,
    motherboard: CircuitBoard,
};

interface HardwareDetailCardProps {
    component: HardwareComponent;
    onEdit?: (component: HardwareComponent) => void;
}

export function HardwareDetailCard({
    component,
    onEdit,
}: HardwareDetailCardProps) {
    const Icon = CATEGORY_ICON_MAP[component.category];

    return (
        <div
            className={cn(
                "group rounded-2xl border bg-white/[0.02] p-4 transition-all duration-200",
                component.filled
                    ? "border-violet-400/20 hover:border-violet-400/45 hover:shadow-[0_0_28px_-8px_rgba(147,51,234,0.6)]"
                    : "border-dashed border-violet-400/25 hover:border-violet-400/45",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
                        component.filled
                            ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
                            : "border-white/10 bg-white/[0.03] text-slate-500",
                    )}
                >
                    <Icon size={20} strokeWidth={2.25} />
                </span>

                <button
                    type="button"
                    onClick={() => onEdit?.(component)}
                    aria-label={`${component.label} düzenle`}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                        component.filled
                            ? "border-white/10 bg-white/[0.03] text-slate-400 hover:border-violet-400/40 hover:text-white"
                            : "border-violet-400/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 hover:text-white",
                    )}
                >
                    {component.filled ? (
                        <>
                            <PencilLine size={13} />
                            Düzenle
                        </>
                    ) : (
                        <>
                            <Plus size={13} />
                            Ekle
                        </>
                    )}
                </button>
            </div>

            <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {component.label}
            </div>

            {component.filled ? (
                <>
                    {component.brand ? (
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300/80">
                            {component.brand}
                        </div>
                    ) : null}

                    <div className="mt-0.5 text-sm font-bold text-white">
                        {component.name}
                    </div>

                    {component.specs ? (
                        <div className="mt-1 text-xs text-slate-400">
                            {component.specs}
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="mt-1 text-sm font-semibold text-slate-500">
                    Bilgi Eklenmedi
                </div>
            )}
        </div>
    );
}
