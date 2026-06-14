/*
 * Sol alt köşedeki online oyuncu durum kartı (UI-only / dekoratif).
 * Yeşil online noktası + glassmorphism + violet çerçeve.
 */

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

interface OnlineStatusBadgeProps {
    /*
     * Çevrimiçi oyuncu sayısı (şimdilik statik dekoratif değer).
     */
    count?: number;
}

export function OnlineStatusBadge({ count = 24568 }: OnlineStatusBadgeProps) {
    const shouldReduceMotion = useReducedMotion();
    const [displayCount, setDisplayCount] = useState(0);
    const visibleCount = shouldReduceMotion ? count : displayCount;

    useEffect(() => {
        if (shouldReduceMotion) {
            return;
        }

        const controls = animate(0, count, {
            duration: 1.4,
            delay: 0.55,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (latest) => setDisplayCount(Math.round(latest)),
        });

        return () => controls.stop();
    }, [count, shouldReduceMotion]);

    return (
        <div className="online-status-badge inline-flex items-center gap-2.5 rounded-2xl border border-violet-400/30 bg-ltz-panel/60 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4">
            <span className="relative flex h-2.5 w-2.5">
                <span className="online-status-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-300">
                ONLINE
            </span>

            <span className="text-xs text-zinc-300">
                <span className="font-semibold text-white">
                    {visibleCount.toLocaleString("tr-TR")}
                </span>{" "}
                <span className="hidden sm:inline">oyuncu çevrimiçi</span>
            </span>
        </div>
    );
}
