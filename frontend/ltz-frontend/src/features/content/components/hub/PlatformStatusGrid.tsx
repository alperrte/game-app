import { Server } from "lucide-react";

import type { PlatformStatusMap } from "../../types/contentStats.types";
import { cn } from "../../../../utils/cn";
import { HubWidgetCard } from "./HubWidgetCard";

interface PlatformStatusGridProps {
    statuses: PlatformStatusMap;
}

function statusLabel(status: string): string {
    if (status === "normal") return "Çevrimiçi";
    if (status === "slow") return "Yavaş";
    if (status === "down" || status === "offline") return "Kapalı";
    return "Bilinmiyor";
}

function statusTone(status: string): string {
    if (status === "normal") {
        return "border-violet-400/30 bg-violet-500/10 text-violet-100";
    }
    if (status === "slow") {
        return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    }
    if (status === "down" || status === "offline") {
        return "border-red-400/35 bg-red-500/10 text-red-100";
    }
    return "border-white/10 bg-white/[0.03] text-slate-300";
}

function statusDot(status: string): string {
    if (status === "normal") {
        return "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]";
    }
    if (status === "slow") {
        return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]";
    }
    if (status === "down" || status === "offline") {
        return "bg-red-400 animate-pulse shadow-[0_0_12px_rgba(248,113,113,0.9)]";
    }
    return "bg-slate-500";
}

export function PlatformStatusGrid({ statuses }: PlatformStatusGridProps) {
    const entries = Object.entries(statuses);

    return (
        <HubWidgetCard
            title="Platform Durumu"
            subtitle="Mağaza ve oyun sunucularının anlık erişilebilirliği"
            icon={Server}
        >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {entries.map(([platform, status]) => (
                    <div
                        key={platform}
                        className={cn(
                            "rounded-2xl border px-4 py-3 transition hover:-translate-y-0.5",
                            statusTone(status),
                        )}
                    >
                        <div className="text-sm font-semibold">{platform}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]">
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    statusDot(status),
                                )}
                            />
                            {statusLabel(status)}
                        </div>
                    </div>
                ))}
            </div>
        </HubWidgetCard>
    );
}
