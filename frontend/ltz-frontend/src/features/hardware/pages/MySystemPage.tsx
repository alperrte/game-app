/*
 * "Sistemim" sayfası.
 *
 * Mod sistemi:
 *  - loading          : skeleton gösterilir
 *  - error            : hata kartı gösterilir
 *  - noHardware + "view"  : HardwareSetupChoice (Detector | Manuel Giriş)
 *  - noHardware + "form"  : ManualHardwareForm (yeni profil)
 *  - data + "view"    : mevcut sistem görünümü
 *  - data + "form"    : ManualHardwareForm (düzenleme, pre-fill)
 *
 * refreshKey: form kayıt sonrası useEffect'i tekrar tetikler.
 */

import { useEffect, useState } from "react";

import { Card } from "../../../components/ui/Card";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { useAuthStore } from "../../../store/authStore";
import { hardwareService } from "../services/hardwareService";
import type {
    ApiUserHardwareResponse,
    MySystemData,
} from "../types/hardware.types";

import { MySystemHeader } from "../components/MySystemHeader";
import { MainSystemCard } from "../components/MainSystemCard";
import { HardwareDetailsGrid } from "../components/HardwareDetailsGrid";
import { MissingHardwareInfoCard } from "../components/MissingHardwareInfoCard";
import { RecommendedUpgradesCard } from "../components/RecommendedUpgradesCard";
import { PerformanceExpectationSection } from "../components/PerformanceExpectationSection";
import { HardwareSetupChoice } from "../components/HardwareSetupChoice";
import { ManualHardwareForm } from "../components/ManualHardwareForm";
import { SystemScoreDetailCard } from "../components/SystemScoreDetailCard";

type PageMode = "view" | "form";

/* ─── Skeleton ─── */
function MySystemSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                    <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
                    <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
                </div>
                <div className="space-y-6">
                    <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
                    <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
                    <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
                </div>
            </div>
            <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
        </div>
    );
}

/* ─── Page ─── */
export default function MySystemPage() {
    const { user } = useAuthStore();

    const [data, setData] = useState<MySystemData | null>(null);
    const [rawHw, setRawHw] = useState<ApiUserHardwareResponse | null>(null);
    const [noHardware, setNoHardware] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* Form açıkken "view", kapalıyken aynı kalır */
    const [mode, setMode] = useState<PageMode>("view");

    /* Kayıt sonrası useEffect'i tetiklemek için */
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yap.");
            return;
        }

        const currentUser = user;
        let active = true;

        async function loadMySystem() {
            setLoading(true);
            setError(null);
            setNoHardware(false);
            setData(null);
            setRawHw(null);

            try {
                /*
                 * Paralel çağrılar:
                 *  - getMySystem      → mapped UI data (null = 404)
                 *  - getUserHardwareRaw → ham backend response (form pre-fill için)
                 */
                const [systemData, rawData] = await Promise.all([
                    hardwareService.getMySystem(currentUser.userId),
                    hardwareService.getUserHardwareRaw(currentUser.userId),
                ]);

                if (!active) return;

                setRawHw(rawData);

                if (systemData === null) {
                    setNoHardware(true);
                } else {
                    setData(systemData);
                }
            } catch (loadError) {
                if (!active) return;
                setError(
                    getErrorMessage(
                        loadError,
                        "Sistem bilgileri yüklenemedi.",
                    ),
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadMySystem();
        return () => { active = false; };
    }, [user, refreshKey]);

    /* ─── Handlers ─── */

    function handleManualEntry() {
        setMode("form");
    }

    function handleEditSystem() {
        setMode("form");
    }

    function handleFormSuccess() {
        setMode("view");
        setRefreshKey((k) => k + 1);
    }

    function handleFormCancel() {
        setMode("view");
    }

    /* ─── Render ─── */
    return (
        <div className="relative bg-[#020817] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(88,28,255,0.22),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

            <div className="relative">
                <main className="mx-auto w-full max-w-[1840px] px-4 py-8 sm:px-6 lg:px-8">
                    {/* Loading */}
                    {loading ? <MySystemSkeleton /> : null}

                    {/* Error */}
                    {!loading && error ? (
                        <Card className="border-red-400/30 bg-red-950/20 p-6 text-red-200">
                            {error}
                        </Card>
                    ) : null}

                    {/* Form modu (hem yeni profil hem düzenleme) */}
                    {!loading && !error && mode === "form" ? (
                        <ManualHardwareForm
                            userId={user!.userId}
                            existingData={rawHw}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    ) : null}

                    {/* Donanım profili yok → iki seçenek */}
                    {!loading && !error && mode === "view" && noHardware ? (
                        <HardwareSetupChoice onManualEntry={handleManualEntry} />
                    ) : null}

                    {/* Mevcut sistem görünümü */}
                    {!loading && !error && mode === "view" && data ? (
                        <div className="space-y-6">
                            <MySystemHeader
                                completionRate={data.summary.completionRate}
                            />

                            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                                {/* Sol kolon */}
                                <div className="space-y-6">
                                    <MainSystemCard
                                        summary={data.summary}
                                        onEdit={handleEditSystem}
                                    />
                                    <HardwareDetailsGrid
                                        components={data.components}
                                        onEditComponent={() => handleEditSystem()}
                                    />
                                </div>

                                {/* Sağ kolon */}
                                <div className="space-y-6">
                                    <SystemScoreDetailCard score={data.score} />
                                    <MissingHardwareInfoCard
                                        missing={data.missing}
                                    />
                                    <RecommendedUpgradesCard
                                        upgrades={data.upgrades}
                                    />
                                </div>
                            </div>

                            {data.performance.length > 0 ? (
                                <PerformanceExpectationSection
                                    games={data.performance}
                                />
                            ) : null}
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
}
