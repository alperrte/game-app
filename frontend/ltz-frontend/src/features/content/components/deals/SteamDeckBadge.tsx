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
    VERIFIED: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    PLAYABLE: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    UNSUPPORTED: "border-red-400/25 bg-red-500/5 text-red-200/80",
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
