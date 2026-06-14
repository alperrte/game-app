/*
 * Sol alt köşedeki online oyuncu durum kartı (UI-only / dekoratif).
 * Yeşil online noktası + glassmorphism + violet çerçeve.
 */

interface OnlineStatusBadgeProps {
    /*
     * Çevrimiçi oyuncu sayısı (şimdilik statik dekoratif değer).
     */
    count?: number;
}

export function OnlineStatusBadge({ count = 24568 }: OnlineStatusBadgeProps) {
    return (
        <div className="inline-flex items-center gap-3 rounded-2xl border border-violet-400/30 bg-ltz-panel/60 px-4 py-2.5 backdrop-blur-xl">
            <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-300">
                ONLINE
            </span>

            <span className="text-xs text-zinc-300">
                <span className="font-semibold text-white">
                    {count.toLocaleString("tr-TR")}
                </span>{" "}
                oyuncu çevrimiçi
            </span>
        </div>
    );
}
