/*
 * Hardware Center ana dashboard sayfası.
 *
 * Düzen:
 *  - Hero (tam genişlik)
 *  - 4'lü stat ızgarası
 *  - İki kolon:
 *      Sol (geniş): Benim Sistemim + Oyun Performans Tahmini
 *      Sağ (dar):   Kampanyalar + FPS Raporları + İncelemeler
 *
 * Veri kaynağı: hardware-service (API Gateway üzerinden).
 * Aktif filtreler sayfada lokal state ile yönetilir.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { useAuthStore } from "../../../store/authStore";
import { HARDWARE_ROUTES } from "../../../lib/constants";
import { hardwareService } from "../services/hardwareService";
import type { HardwareDashboardData } from "../types/hardware.types";
import { HardwareHero } from "../components/HardwareHero";
import { HardwareStatsGrid } from "../components/HardwareStatsGrid";
import { MySystemOverviewCard } from "../components/MySystemOverviewCard";
import { PerformancePredictionCard } from "../components/PerformancePredictionCard";
import { HardwareDealsCard } from "../components/HardwareDealsCard";
import { FpsReportsCard } from "../components/FpsReportsCard";
import { HardwareReviewsCard } from "../components/HardwareReviewsCard";

function HardwareSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-32 animate-pulse rounded-2xl bg-white/5"
                    />
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                    <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
                    <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
                </div>
                <div className="space-y-6">
                    <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
                    <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
                </div>
            </div>
        </div>
    );
}

export default function HardwareCenterPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [data, setData] = useState<HardwareDashboardData | null>(null);
    const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yap.");
            return;
        }

        const currentUser = user;
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError(null);
            setData(null);

            try {
                const response = await hardwareService.getHardwareDashboard(
                    currentUser.userId,
                );

                if (!active) return;

                setData(response);
                setActiveFilterIds(response.activeFilterIds);
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(
                        loadError,
                        "Hardware Center verileri yüklenemedi.",
                    ),
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            active = false;
        };
    }, [user]);

    function handleFilterToggle(filterId: string) {
        setActiveFilterIds((current) =>
            current.includes(filterId)
                ? current.filter((id) => id !== filterId)
                : [...current, filterId],
        );
    }

    return (
        <div className="relative bg-[#020817] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(88,28,255,0.22),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

            <div className="relative min-h-screen">
                <main className="mx-auto max-w-[1840px] px-4 py-8 sm:px-6 lg:px-8">
                    {loading ? <HardwareSkeleton /> : null}

                    {!loading && error ? (
                        <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                            {error}
                        </Card>
                    ) : null}

                    {!loading && !error && data ? (
                        <div className="space-y-6">
                            <HardwareHero content={data.hero} />

                            <HardwareStatsGrid stats={data.stats} />

                            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                                {/* Sol kolon */}
                                <div className="space-y-6">
                                    <MySystemOverviewCard
                                        system={data.mySystem}
                                        onUpdate={() =>
                                            navigate(HARDWARE_ROUTES.mySystem)
                                        }
                                    />
                                    <PerformancePredictionCard
                                        filters={data.performanceFilters}
                                        activeFilterIds={activeFilterIds}
                                        predictions={data.performance}
                                        onFilterToggle={handleFilterToggle}
                                    />
                                </div>

                                {/* Sağ kolon */}
                                <div className="space-y-6">
                                    <HardwareDealsCard deals={data.deals} />
                                    <FpsReportsCard reports={data.fpsReports} />
                                    <HardwareReviewsCard
                                        reviews={data.reviews}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
}
