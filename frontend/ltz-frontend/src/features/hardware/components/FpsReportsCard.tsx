/*
 * "Son FPS Raporları" kartı.
 * Topluluk kullanıcılarının paylaştığı FPS sonuçlarını listeler.
 */

import { Clock } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type { FpsReport } from "../types/hardware.types";

interface FpsReportsCardProps {
    reports: FpsReport[];
    onViewAll?: () => void;
}

export function FpsReportsCard({ reports, onViewAll }: FpsReportsCardProps) {
    return (
        <Card className="p-5">
            <HardwarePanelHeader
                title="Son FPS Raporları"
                actionLabel="Tümünü Gör"
                onAction={onViewAll}
            />

            <div className="mt-4 flex flex-col gap-3">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className="rounded-2xl border border-violet-400/15 bg-white/[0.02] p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-violet-200">
                                    {report.username}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-white">
                                        {report.gameName}
                                    </span>
                                    <span className="shrink-0 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-200">
                                        {report.presetLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className="text-lg font-black text-cyan-300">
                                    {report.fps}
                                </span>
                                <span className="ml-1 text-[10px] font-semibold text-slate-400">
                                    FPS
                                </span>
                            </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-400">
                            {report.hardwareSummary}
                        </div>

                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <Clock size={11} />
                            {report.timeAgo}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
