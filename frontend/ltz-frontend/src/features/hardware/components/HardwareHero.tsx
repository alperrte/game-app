/*
 * Hardware Center üst hero kartı.
 *
 * - Arka planda ltz-hardware-hero-bg görseli sağda güçlü durur.
 * - Sol tarafa dark gradient overlay eklenip yazılar okunabilir kalır.
 * - Primary CTA (Sistemimi Güncelle) neon gradient, diğerleri dark/neon
 *   secondary butonlardır.
 */

import { Activity } from "lucide-react";

import { cn } from "../../../utils/cn";
import heroBg from "../../../assets/ltz-hardware-hero-bg.png";
import type { HardwareHeroAction, HardwareHeroContent } from "../types/hardware.types";

interface HardwareHeroProps {
    content: HardwareHeroContent;
    onAction?: (action: HardwareHeroAction) => void;
}

export function HardwareHero({ content, onAction }: HardwareHeroProps) {
    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-3xl border border-violet-400/35",
                "shadow-[0_0_80px_rgba(124,58,237,0.35)]",
            )}
        >
            {/* Arka plan görseli (sağda güçlü) */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-right bg-no-repeat"
                style={{ backgroundImage: `url(${heroBg})` }}
            />

            {/* Sol taraftaki yazıları okunabilir tutan dark gradient overlay */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,4,13,0.95)_0%,rgba(5,8,22,0.85)_42%,rgba(5,8,22,0.45)_70%,rgba(124,58,237,0.18)_100%)]"
            />

            {/* İnce scanline dokusu (cyberpunk hissi) */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_4px)]"
            />

            {/* Alt neon çizgi */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-transparent"
            />

            <div className="relative z-10 max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
                <span
                    className={cn(
                        "inline-flex items-center gap-2 rounded-full border border-cyan-300/40",
                        "bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200",
                    )}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                    </span>
                    <Activity size={13} className="animate-pulse" />
                    {content.statusBadge}
                </span>

                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {content.title}
                </h1>

                <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
                    {content.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                    {content.actions.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => onAction?.(action)}
                            className={cn(
                                "inline-flex h-11 items-center justify-center rounded-xl px-5",
                                "text-sm font-semibold tracking-wide transition-all duration-200",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                                action.variant === "primary"
                                    ? cn(
                                          "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 text-white",
                                          "shadow-[0_0_32px_rgba(147,51,234,0.55)]",
                                          "hover:shadow-[0_0_44px_rgba(217,70,239,0.65)] hover:scale-[1.02]",
                                      )
                                    : cn(
                                          "border border-violet-400/30 bg-white/[0.04] text-slate-200 backdrop-blur-sm",
                                          "hover:border-violet-400/60 hover:bg-white/[0.08] hover:text-white",
                                      ),
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
