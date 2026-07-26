import { Award, Flame, Lock, Target, Trophy } from "lucide-react";

import { Card } from "../../../../components/ui/Card";
import { cn } from "../../../../utils/cn";
import type { TriviaStatsResponse } from "../../types/trivia.types";

interface TriviaStreakPanelProps {
    stats: TriviaStatsResponse;
}

const STREAK_MILESTONES = [
    { days: 3, label: "3 Gün" },
    { days: 7, label: "1 Hafta" },
    { days: 14, label: "2 Hafta" },
    { days: 30, label: "1 Ay" },
] as const;

function buildLastDays(count: number): string[] {
    const days: string[] = [];
    const cursor = new Date();
    for (let i = 0; i < count; i++) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        days.unshift(`${yyyy}-${mm}-${dd}`);
        cursor.setDate(cursor.getDate() - 1);
    }
    return days;
}

export function TriviaStreakPanel({ stats }: TriviaStreakPanelProps) {
    const accuracy =
        stats.totalAnswered > 0
            ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
            : 0;

    const historyByDate = new Map(
        stats.history.map((entry) => [entry.date, entry.correct]),
    );
    const lastDays = buildLastDays(7);

    return (
        <Card className="mb-6 border-white/10 bg-slate-950/55 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3">
                    <Flame size={20} className="text-fuchsia-300" />
                    <div>
                        <div className="text-lg font-black text-white">
                            {stats.currentStreak}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Gün streak
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3">
                    <Trophy size={20} className="text-violet-300" />
                    <div>
                        <div className="text-lg font-black text-white">
                            {stats.totalCorrect}
                            <span className="text-slate-500">
                                /{stats.totalAnswered}
                            </span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Doğru cevap
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
                    <Target size={20} className="text-emerald-300" />
                    <div>
                        <div className="text-lg font-black text-white">
                            %{accuracy}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            İsabet oranı
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {lastDays.map((date) => {
                    const answered = historyByDate.has(date);
                    const correct = historyByDate.get(date);

                    return (
                        <div
                            key={date}
                            title={date}
                            className={cn(
                                "h-2.5 flex-1 rounded-full",
                                !answered
                                    ? "bg-white/10"
                                    : correct
                                      ? "bg-emerald-400/70"
                                      : "bg-red-400/60",
                            )}
                        />
                    );
                })}
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Son 7 gün
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STREAK_MILESTONES.map((milestone) => {
                    const unlocked = stats.currentStreak >= milestone.days;

                    return (
                        <div
                            key={milestone.days}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center",
                                unlocked
                                    ? "border-fuchsia-400/35 bg-fuchsia-500/10"
                                    : "border-white/10 bg-white/[0.02] opacity-60",
                            )}
                        >
                            {unlocked ? (
                                <Award size={18} className="text-fuchsia-300" />
                            ) : (
                                <Lock size={16} className="text-slate-500" />
                            )}
                            <span
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.1em]",
                                    unlocked ? "text-fuchsia-100" : "text-slate-500",
                                )}
                            >
                                {milestone.label} rozeti
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
