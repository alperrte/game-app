/*
 * "Sistemim" sayfasının üst başlık bölümü.
 *
 * Başlık + profil tamamlanma rozeti + alt açıklama ve sağda aksiyon
 * butonları. "Değişiklikleri Kaydet" primary mor gradient, diğerleri
 * secondary dark neon butonlardır.
 */

import { GitCompare, Plus, Save } from "lucide-react";

import { cn } from "../../../utils/cn";

interface MySystemHeaderProps {
    completionRate: number;
    onCompare?: () => void;
    onAddFpsReport?: () => void;
    onSave?: () => void;
}

export function MySystemHeader({
    completionRate,
    onCompare,
    onAddFpsReport,
    onSave,
}: MySystemHeaderProps) {
    return (
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Sistemim
                    </h1>

                    <span
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border border-cyan-300/40",
                            "bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200",
                        )}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                        </span>
                        Profil Tamamlanma Oranı: %{completionRate}
                    </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                    Donanım profilini düzenle, performansını analiz et, oyun
                    uyumluluğunu takip et.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onCompare}
                    className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4",
                        "text-sm font-semibold tracking-wide transition-all duration-200",
                        "border border-violet-400/30 bg-white/[0.04] text-slate-200 backdrop-blur-sm",
                        "hover:border-violet-400/60 hover:bg-white/[0.08] hover:text-white",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                    )}
                >
                    <GitCompare size={16} />
                    Donanım Karşılaştır
                </button>

                <button
                    type="button"
                    onClick={onAddFpsReport}
                    className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4",
                        "text-sm font-semibold tracking-wide transition-all duration-200",
                        "border border-violet-400/30 bg-white/[0.04] text-slate-200 backdrop-blur-sm",
                        "hover:border-violet-400/60 hover:bg-white/[0.08] hover:text-white",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                    )}
                >
                    <Plus size={16} />
                    FPS Raporu Ekle
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5",
                        "text-sm font-semibold tracking-wide transition-all duration-200",
                        "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 text-white",
                        "shadow-[0_0_32px_rgba(147,51,234,0.55)]",
                        "hover:shadow-[0_0_44px_rgba(217,70,239,0.65)] hover:scale-[1.02]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                    )}
                >
                    <Save size={16} />
                    Değişiklikleri Kaydet
                </button>
            </div>
        </header>
    );
}
