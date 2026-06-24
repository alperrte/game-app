/*
 * "Sistemim" sayfasının boş durum landing'i.
 *
 * Kullanıcının donanım profili yokken iki seçenek sunar:
 *  1. LTZ Hardware Detector — ileride bağlanacak otomatik tanıma uygulaması (şimdilik placeholder)
 *  2. Manuel Sistem Girişi — aktif, formu açar
 */

import { Activity, ChevronRight, CircuitBoard, HardDrive, Scan } from "lucide-react";

import { cn } from "../../../utils/cn";
import { Card } from "../../../components/ui/Card";

interface HardwareSetupChoiceProps {
    onManualEntry: () => void;
}

const DETECTOR_FEATURES = [
    "Otomatik donanım tanıma",
    "Gerçek zamanlı FPS izleme",
    "Sürücü ve güncelleme analizi",
    "Sistem sağlığı raporları",
];

const MANUAL_FEATURES = [
    "CPU, GPU, RAM ve Depolama",
    "Anakart, Monitör, Çevre birimleri",
    "İşletim sistemi ve ekran ayarları",
    "Hardware Center'da görüntülenir",
];

export function HardwareSetupChoice({ onManualEntry }: HardwareSetupChoiceProps) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-black text-white sm:text-3xl">
                    Sistem Profilini Oluştur
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Donanım profilini nasıl oluşturmak istediğini seç
                </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                {/* ─── LTZ Hardware Detector (placeholder) ─── */}
                <div
                    className={cn(
                        "relative overflow-hidden rounded-3xl border border-violet-400/15",
                        "bg-white/[0.015] p-7 opacity-65",
                    )}
                >
                    <span
                        className={cn(
                            "absolute right-5 top-5 rounded-full border border-fuchsia-400/40",
                            "bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase",
                            "tracking-[0.18em] text-fuchsia-300",
                        )}
                    >
                        Yakında
                    </span>

                    <span
                        className={cn(
                            "grid h-14 w-14 place-items-center rounded-2xl",
                            "border border-violet-400/25 bg-violet-500/8 text-violet-400",
                        )}
                    >
                        <Scan size={28} strokeWidth={1.75} />
                    </span>

                    <h3 className="mt-5 text-xl font-black text-white">
                        LTZ Hardware Detector
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        LTZ uygulaması bilgisayarına bağlanarak sistemini otomatik olarak
                        tanır, FPS verilerini izler ve detaylı performans raporları üretir.
                    </p>

                    <ul className="mt-5 space-y-2.5">
                        {DETECTOR_FEATURES.map((f) => (
                            <li
                                key={f}
                                className="flex items-center gap-2.5 text-sm text-slate-600"
                            >
                                <span
                                    className={cn(
                                        "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                                        "border border-violet-400/15 bg-violet-500/8",
                                    )}
                                >
                                    <Activity size={11} className="text-violet-400/50" />
                                </span>
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        disabled
                        className={cn(
                            "mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                            "border border-white/5 bg-white/[0.02] text-sm font-semibold text-slate-600",
                            "cursor-not-allowed",
                        )}
                    >
                        Yakında Gelecek
                    </button>
                </div>

                {/* ─── Manuel Sistem Girişi ─── */}
                <Card
                    className={cn(
                        "relative overflow-hidden p-7",
                        "border-cyan-400/25",
                        "bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.06),transparent_50%)]",
                    )}
                >
                    <span
                        className={cn(
                            "absolute right-5 top-5 rounded-full border border-cyan-300/40",
                            "bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase",
                            "tracking-[0.18em] text-cyan-200",
                        )}
                    >
                        Aktif
                    </span>

                    <span
                        className={cn(
                            "grid h-14 w-14 place-items-center rounded-2xl",
                            "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
                            "shadow-[0_0_24px_rgba(34,211,238,0.25)]",
                        )}
                    >
                        <CircuitBoard size={28} strokeWidth={1.75} />
                    </span>

                    <h3 className="mt-5 text-xl font-black text-white">
                        Manuel Sistem Girişi
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        Donanım bileşenlerini kendin girerek sistem profilini oluştur.
                        Hardware Center'da görüntülenir ve oyun uyumluluğu analiz edilir.
                    </p>

                    <ul className="mt-5 space-y-2.5">
                        {MANUAL_FEATURES.map((f) => (
                            <li
                                key={f}
                                className="flex items-center gap-2.5 text-sm text-slate-300"
                            >
                                <span
                                    className={cn(
                                        "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                                        "border border-cyan-400/40 bg-cyan-400/10",
                                    )}
                                >
                                    <ChevronRight size={11} className="text-cyan-400" />
                                </span>
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={onManualEntry}
                        className={cn(
                            "mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                            "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600",
                            "text-sm font-semibold text-white",
                            "shadow-[0_0_28px_rgba(147,51,234,0.45)]",
                            "transition-all duration-200",
                            "hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(217,70,239,0.55)]",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                        )}
                    >
                        <HardDrive size={16} />
                        Sistemi Manuel Gir
                    </button>
                </Card>
            </div>
        </div>
    );
}
