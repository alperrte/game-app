/*
 * "Ana Sistem" kartı (sayfanın sol kolon ana odağı).
 *
 * Sol tarafta büyük gaming PC görsel/placeholder alanı, sağ tarafta
 * sistem özet chipleri; altta uyumluluk rozetleri ve düzenleme butonu.
 */

import {
    Cpu,
    HardDrive,
    MemoryStick,
    MonitorCog,
    PencilLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { getImageUrl } from "../../user/utils/profileImage";
import type { SystemSpec, SystemSummary } from "../types/hardware.types";

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

interface MainSystemCardProps {
    summary: SystemSummary;
    onEdit?: () => void;
}

export function MainSystemCard({ summary, onEdit }: MainSystemCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-black text-white">
                        Ana Sistem: {summary.name}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                        Son güncelleme: {summary.lastUpdatedLabel}
                    </p>
                </div>

                <span className="hidden shrink-0 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200 sm:inline">
                    Aktif Profil
                </span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
                {/* Sol: rig görseli veya placeholder */}
                <div className="relative min-h-52 overflow-hidden rounded-2xl border border-violet-400/25">
                    {summary.rigImageUrl ? (
                        <img
                            src={getImageUrl(summary.rigImageUrl)}
                            alt={`${summary.name} rig`}
                            className="h-full min-h-52 w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-full min-h-52 place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.28),transparent_60%)]">
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 opacity-[0.10] mix-blend-overlay bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_5px)]"
                            />
                            <div className="relative flex flex-col items-center gap-3 text-center">
                                <span className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/40 bg-violet-500/15 text-violet-200 shadow-[0_0_36px_rgba(147,51,234,0.45)]">
                                    <MonitorCog size={40} strokeWidth={1.75} />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                                    {summary.name} Rig
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sağ: sistem özet chipleri */}
                <div className="grid grid-cols-2 gap-3">
                    {summary.chips.map((chip) => {
                        const Icon = SPEC_ICON_MAP[chip.icon];

                        return (
                            <div
                                key={chip.label}
                                className={cn(
                                    "rounded-2xl border border-violet-400/20 bg-white/[0.03] p-4",
                                    "transition-colors hover:border-violet-400/40",
                                )}
                            >
                                <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200">
                                    <Icon size={18} strokeWidth={2.25} />
                                </span>

                                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    {chip.label}
                                </div>
                                <div className="mt-0.5 text-sm font-semibold text-white">
                                    {chip.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Uyumluluk rozetleri */}
            <div className="mt-5 flex flex-wrap gap-2">
                {summary.compatibility.map((badge) => (
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
                onClick={onEdit}
                className={cn(
                    "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                    "border border-violet-400/30 bg-white/[0.04] text-sm font-semibold text-slate-200 backdrop-blur-sm",
                    "transition-all duration-200 hover:border-violet-400/60 hover:bg-white/[0.08] hover:text-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                )}
            >
                <PencilLine size={16} />
                Sistem Bilgilerini Düzenle
            </button>
        </Card>
    );
}
