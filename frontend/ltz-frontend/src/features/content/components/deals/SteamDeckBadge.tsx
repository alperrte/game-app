import { cn } from "../../../../utils/cn";
import type { SteamDeckStatus } from "../../types/deals.types";

interface SteamDeckBadgeProps {
    status?: SteamDeckStatus | null;
    className?: string;
}

const labels: Record<string, string> = {
    VERIFIED: "Deck Onaylı",
    PLAYABLE: "Deck Oynanabilir",
    UNSUPPORTED: "Deck Desteksiz",
};

const tones: Record<string, string> = {
    VERIFIED: "border-violet-400/40 bg-violet-500/15 text-violet-100",
    PLAYABLE: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100",
    UNSUPPORTED: "border-white/10 bg-white/[0.04] text-slate-400",
};

export function SteamDeckBadge({ status, className }: SteamDeckBadgeProps) {
    if (!status) return null;

    const normalized = status.toUpperCase();

    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                tones[normalized] ?? tones.UNSUPPORTED,
                className,
            )}
        >
            {labels[normalized] ?? status}
        </span>
    );
}
