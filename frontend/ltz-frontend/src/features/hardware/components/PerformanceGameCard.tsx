/*
 * "Performans Beklentisi" bölümündeki tek bir oyun kartı.
 *
 * Oyun görsel placeholder + isim + FPS rozeti + önerilen ayar rozeti +
 * neon performans barı + uyumluluk durumu içerir.
 */

import { Gamepad2, Zap } from "lucide-react";

import { cn } from "../../../utils/cn";
import type { PerformanceExpectation } from "../types/hardware.types";

interface PerformanceGameCardProps {
    game: PerformanceExpectation;
}

/*
 * Bar doluluğuna göre neon renk eşiği (dashboard performans kartıyla aynı dil).
 */
function resolveBar(percent: number): { barClass: string; glow: string } {
    if (percent < 65) {
        return {
            barClass: "from-violet-500 via-fuchsia-500 to-fuchsia-400",
            glow: "rgba(217,70,239,0.6)",
        };
    }
    return {
        barClass: "from-fuchsia-500 via-violet-400 to-cyan-400",
        glow: "rgba(34,211,238,0.6)",
    };
}

export function PerformanceGameCard({ game }: PerformanceGameCardProps) {
    const bar = resolveBar(game.percent);

    return (
        <div className="overflow-hidden rounded-2xl border border-violet-400/20 bg-white/[0.02] transition-all duration-200 hover:border-violet-400/45 hover:shadow-[0_0_28px_-8px_rgba(147,51,234,0.6)]">
            {/* Oyun görsel placeholder */}
            <div className="relative grid h-28 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.32),transparent_65%)]">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_5px)]"
                />
                <Gamepad2
                    size={34}
                    strokeWidth={1.75}
                    className="relative text-violet-200/80"
                />

                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-cyan-300/40 bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold text-cyan-200 backdrop-blur-sm">
                    <Zap size={11} />
                    {game.fpsLabel}
                </span>
            </div>

            <div className="p-4">
                <h3 className="truncate text-sm font-bold text-white">
                    {game.gameName}
                </h3>

                <span className="mt-2 inline-block rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-fuchsia-200">
                    {game.settingLabel}
                </span>

                {/* Neon performans barı */}
                <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                    role="progressbar"
                    aria-valuenow={game.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${game.gameName} performans`}
                >
                    <div
                        className={cn(
                            "h-full rounded-full bg-gradient-to-r",
                            bar.barClass,
                        )}
                        style={{
                            width: `${game.percent}%`,
                            boxShadow: `0 0 10px ${bar.glow}`,
                            transition: "width 700ms ease-out",
                        }}
                    />
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    {game.compatibilityLabel}
                </div>
            </div>
        </div>
    );
}
