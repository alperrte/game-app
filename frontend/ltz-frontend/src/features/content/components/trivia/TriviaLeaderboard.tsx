import { useEffect, useState } from "react";
import { Flame, Users } from "lucide-react";

import { Card } from "../../../../components/ui/Card";
import { useCurrentUserProfile } from "../../../user/context/CurrentUserProfileContext";
import { userService } from "../../../user/services/userService";
import { socialService } from "../../../social/services/socialService";
import { contentService } from "../../services/contentService";
import type { TriviaStatsResponse } from "../../types/trivia.types";

interface LeaderboardRow {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    isMe: boolean;
    currentStreak: number;
    totalCorrect: number;
}

interface TriviaLeaderboardProps {
    myStats: TriviaStatsResponse;
}

export function TriviaLeaderboard({ myStats }: TriviaLeaderboardProps) {
    const { profile } = useCurrentUserProfile();
    const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadLeaderboard() {
            if (!profile?.userId) {
                if (active) {
                    setLoading(false);
                    setRows(null);
                }
                return;
            }

            setLoading(true);
            try {
                const friendships = await socialService.getFriends(profile.userId);
                const friendIds = friendships.map((f) => f.friendUserId);

                if (friendIds.length === 0) {
                    if (active) {
                        setRows([]);
                        setLoading(false);
                    }
                    return;
                }

                const [profiles, bulkStats] = await Promise.all([
                    userService.getProfilesBatch(
                        friendIds.map((id) => String(id)),
                    ),
                    contentService.getBulkTriviaStats(friendIds),
                ]);

                if (!active) return;

                const friendRows: LeaderboardRow[] = profiles.map((p) => {
                    const stats = bulkStats[p.userId] ?? bulkStats[String(p.userId)];
                    return {
                        userId: p.userId,
                        displayName: p.displayName || p.username,
                        avatarUrl: p.avatarUrl,
                        isMe: false,
                        currentStreak: stats?.currentStreak ?? 0,
                        totalCorrect: stats?.totalCorrect ?? 0,
                    };
                });

                friendRows.push({
                    userId: profile.userId,
                    displayName: "Sen",
                    avatarUrl: profile.avatarUrl,
                    isMe: true,
                    currentStreak: myStats.currentStreak,
                    totalCorrect: myStats.totalCorrect,
                });

                friendRows.sort(
                    (a, b) =>
                        b.currentStreak - a.currentStreak ||
                        b.totalCorrect - a.totalCorrect,
                );

                setRows(friendRows);
            } catch {
                if (active) setRows(null);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadLeaderboard();

        return () => {
            active = false;
        };
    }, [profile?.userId, profile?.avatarUrl, myStats]);

    if (loading || rows === null) return null;

    return (
        <Card className="mb-6 border-white/10 bg-slate-950/55 p-5">
            <div className="mb-4 flex items-center gap-2">
                <Users size={16} className="text-violet-300" />
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
                    Arkadaş Liderlik Tablosu
                </h3>
            </div>

            {rows.length === 0 ? (
                <p className="text-sm text-slate-400">
                    Henüz arkadaşın yok. Arkadaş eklediğinde trivia streak'lerinizi
                    burada karşılaştırabilirsin.
                </p>
            ) : (
                <div className="space-y-2">
                    {rows.map((row, index) => (
                        <div
                            key={row.userId}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                                row.isMe
                                    ? "border-violet-400/35 bg-violet-500/10"
                                    : "border-white/10 bg-white/[0.02]"
                            }`}
                        >
                            <span className="w-5 shrink-0 text-center text-xs font-black text-slate-500">
                                {index + 1}
                            </span>
                            {row.avatarUrl ? (
                                <img
                                    src={row.avatarUrl}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
                                    {row.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                                {row.displayName}
                            </span>
                            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-fuchsia-300">
                                <Flame size={12} />
                                {row.currentStreak}
                            </span>
                            <span className="w-14 shrink-0 text-right text-xs text-slate-500">
                                {row.totalCorrect} doğru
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
