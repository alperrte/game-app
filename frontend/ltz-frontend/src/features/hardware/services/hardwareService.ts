/*
 * Hardware Center veri servisi.
 *
 * Tüm istekler API Gateway üzerinden gider (VITE_API_BASE_URL).
 * Secret/config değeri kod içinde bulunmaz; her şey .env ve apiClient'tan gelir.
 *
 * Mapping katmanı:
 *  - Backend DTO'ları (Api* tipleri) burada UI tiplerine dönüştürülür.
 *  - Component'ler yalnızca UI tiplerini görür; API formatı buraya hapsedilir.
 *
 * Fallback stratejisi:
 *  - 404 (kullanıcı donanımı yok) → null döner, sayfa boş-durum gösterir.
 *  - Kampanya/inceleme/rapor hataları → [] döner, dashboard bölümler gizlenir.
 *  - Hero, stats, performanceFilters → backend'de aggregate endpoint yok;
 *    bu alanlar anlamlı statik verilerle doldurulur.
 */

import { isAxiosError } from "axios";

import { apiClient } from "../../../lib/axios";
import { HARDWARE_API_ENDPOINTS } from "../../../lib/constants";
import type {
    ApiComponentCategory,
    ApiComponentType,
    ApiGamePerformanceReport,
    ApiGraphicsPreset,
    ApiHardwareComponent,
    ApiHardwareDeal,
    ApiHardwareReview,
    ApiUserHardwareResponse,
    ApiUserHardwareUpsertRequest,
} from "../types/hardware.types";
import type {
    FpsReport,
    GamePerformancePrediction,
    HardwareComponent,
    HardwareDashboardData,
    HardwareDeal,
    HardwareReview,
    MissingHardwareInfo,
    MySystemData,
    MySystemOverview,
    PerformanceExpectation,
    SystemCompatibilityBadge,
    SystemScoreBreakdown,
    SystemSummary,
    UpgradeRecommendation,
} from "../types/hardware.types";

/* ─────────────────────────── yardımcı fonksiyonlar ─────────────────────────── */

function formatRam(ramGb: number | null, ramType: string | null): string {
    if (!ramGb) return "—";
    return ramType ? `${ramGb}GB ${ramType}` : `${ramGb}GB`;
}

function formatStorage(storageGb: number | null, storageType: string | null): string {
    if (!storageGb) return "—";
    const size = storageGb >= 1000 ? `${storageGb / 1000}TB` : `${storageGb}GB`;
    return storageType ? `${size} ${storageType}` : size;
}

function formatPreset(preset: ApiGraphicsPreset | null): string {
    if (!preset) return "";
    const labels: Record<ApiGraphicsPreset, string> = {
        LOW: "Düşük",
        MEDIUM: "Orta",
        HIGH: "Yüksek",
        ULTRA: "Ultra",
        CUSTOM: "Özel",
    };
    return labels[preset];
}

function formatPrice(price: number | null, currency: string | null): string {
    if (price === null || price === undefined) return "—";
    return `${price.toLocaleString("tr-TR")} ${currency ?? "TL"}`;
}

function formatDiscountLabel(pct: number | null): string {
    if (!pct) return "";
    return `-%${Math.round(pct)}`;
}

/*
 * Basit göreli zaman etiketi (örn. "3 gün önce").
 * ISO 8601 veya LocalDateTime string'i kabul eder.
 */
function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}gün önce`;
    return `${Math.floor(days / 30)}ay önce`;
}

/*
 * Profil tamamlanma oranı: 8 ana alanın kaçı dolu?
 * Her alan = 12.5 puan (toplam 100).
 */
function calcCompletionRate(hw: ApiUserHardwareResponse): number {
    const fields: unknown[] = [
        hw.cpuComponent,
        hw.gpuComponent,
        hw.ramGb,
        hw.storageGb,
        hw.motherboardComponent,
        hw.monitorComponent,
        hw.operatingSystem,
        hw.monitorRefreshRate,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
}

/*
 * Temel bileşen puanı: CPU + GPU + RAM + Storage 0-100.
 */
function calcCoreScore(hw: ApiUserHardwareResponse): number {
    const core = [hw.cpuComponent, hw.gpuComponent, hw.ramGb, hw.storageGb];
    return Math.round((core.filter(Boolean).length / core.length) * 100);
}

/*
 * Çevre birimi puanı: Monitor + Keyboard + Mouse + Headset 0-100.
 */
function calcPeripheralScore(hw: ApiUserHardwareResponse): number {
    const p = [
        hw.monitorComponent,
        hw.keyboardComponent,
        hw.mouseComponent,
        hw.headsetComponent,
    ];
    return Math.round((p.filter(Boolean).length / p.length) * 100);
}

/*
 * Sistem kurulum puanı: OS + resolution + refresh rate 0-100.
 */
function calcSetupScore(hw: ApiUserHardwareResponse): number {
    const s = [hw.operatingSystem, hw.monitorResolution, hw.monitorRefreshRate];
    return Math.round((s.filter(Boolean).length / s.length) * 100);
}

function resolveTierLabel(score: number): string {
    if (score >= 90) return "Pro Rig";
    if (score >= 70) return "High-End Rig";
    if (score >= 50) return "Mid-Range Rig";
    if (score > 0) return "Entry Level";
    return "Profil Kurulmadı";
}

function resolveCompatibilityBadges(
    hw: ApiUserHardwareResponse,
): SystemCompatibilityBadge[] {
    const badges: SystemCompatibilityBadge[] = [];
    if (hw.gpuComponent) {
        badges.push({ label: "1080p Ready", tone: "violet" });
    }
    if (hw.monitorRefreshRate && hw.monitorRefreshRate >= 144) {
        badges.push({ label: "High Refresh Ready", tone: "cyan" });
    }
    if (hw.ramGb && hw.ramGb >= 16) {
        badges.push({ label: "Competitive FPS Ready", tone: "fuchsia" });
    }
    if (hw.motherboardComponent) {
        badges.push({ label: "Full Build", tone: "violet" });
    }
    return badges;
}

/*
 * Hedef FPS tahmini — preset bazlı basit eşik.
 * Backend'de scoring API olmadığından client-side hesaplanır.
 */
function estimateTargetFps(preset: ApiGraphicsPreset | null): number {
    switch (preset) {
        case "LOW":    return 144;
        case "MEDIUM": return 120;
        case "HIGH":   return 90;
        case "ULTRA":  return 60;
        default:       return 60;
    }
}

function calcFpsPercent(
    avgFps: number | null,
    preset: ApiGraphicsPreset | null,
): number {
    if (!avgFps) return 0;
    return Math.min(100, Math.round((avgFps / estimateTargetFps(preset)) * 100));
}

function resolveFpsCompatibility(avgFps: number | null): string {
    if (!avgFps) return "—";
    if (avgFps >= 144) return "Mükemmel";
    if (avgFps >= 90) return "Çok İyi";
    if (avgFps >= 60) return "İyi";
    if (avgFps >= 30) return "Orta";
    return "Düşük";
}

/* ─────────────────── API → UI mapping fonksiyonları ─────────────────────── */

function mapHwToMySystemOverview(hw: ApiUserHardwareResponse): MySystemOverview {
    const score = calcCompletionRate(hw);
    return {
        specs: [
            { label: "GPU", value: hw.gpuComponent?.modelName ?? "—", icon: "gpu" },
            { label: "CPU", value: hw.cpuComponent?.modelName ?? "—", icon: "cpu" },
            { label: "RAM", value: formatRam(hw.ramGb, hw.ramType), icon: "ram" },
            {
                label: "Depolama",
                value: formatStorage(hw.storageGb, hw.storageType),
                icon: "storage",
            },
        ],
        score,
        scoreMax: 100,
        tierLabel: resolveTierLabel(score),
        compatibility: resolveCompatibilityBadges(hw),
    };
}

function mapHwToSystemSummary(hw: ApiUserHardwareResponse): SystemSummary {
    return {
        name: hw.operatingSystem
            ? "Bilgisayarım"
            : hw.cpuComponent?.modelName?.split(" ")[0] ?? "Sistemim",
        lastUpdatedLabel: formatRelativeTime(hw.updatedAt),
        completionRate: calcCompletionRate(hw),
        chips: [
            { label: "GPU", value: hw.gpuComponent?.modelName ?? "—", icon: "gpu" },
            { label: "CPU", value: hw.cpuComponent?.modelName ?? "—", icon: "cpu" },
            { label: "RAM", value: formatRam(hw.ramGb, hw.ramType), icon: "ram" },
            {
                label: "Depolama",
                value: formatStorage(hw.storageGb, hw.storageType),
                icon: "storage",
            },
        ],
        compatibility: resolveCompatibilityBadges(hw),
    };
}

function mapHwToScoreBreakdown(hw: ApiUserHardwareResponse): SystemScoreBreakdown {
    const overall = calcCompletionRate(hw);
    return {
        score: overall,
        scoreMax: 100,
        tierLabel: resolveTierLabel(overall),
        breakdown: [
            {
                label: "Temel Bileşenler",
                value: calcCoreScore(hw),
                tone: "violet",
            },
            {
                label: "Çevre Birimleri",
                value: calcPeripheralScore(hw),
                tone: "cyan",
            },
            {
                label: "Sistem Kurulumu",
                value: calcSetupScore(hw),
                tone: "fuchsia",
            },
            {
                label: "Profil Tamamlanma",
                value: overall,
                tone: "cyan",
            },
        ],
    };
}

function mapHwToComponents(hw: ApiUserHardwareResponse): HardwareComponent[] {
    return [
        {
            id: "gpu",
            category: "gpu",
            label: "Ekran Kartı",
            brand: hw.gpuComponent?.brandName ?? undefined,
            name: hw.gpuComponent?.modelName ?? undefined,
            filled: !!hw.gpuComponent,
        },
        {
            id: "cpu",
            category: "cpu",
            label: "İşlemci",
            brand: hw.cpuComponent?.brandName ?? undefined,
            name: hw.cpuComponent?.modelName ?? undefined,
            filled: !!hw.cpuComponent,
        },
        {
            id: "ram",
            category: "ram",
            label: "Bellek (RAM)",
            name: hw.ramGb ? formatRam(hw.ramGb, hw.ramType) : undefined,
            filled: !!hw.ramGb,
        },
        {
            id: "storage",
            category: "storage",
            label: "Depolama",
            name: hw.storageGb
                ? formatStorage(hw.storageGb, hw.storageType)
                : undefined,
            filled: !!hw.storageGb,
        },
        {
            id: "motherboard",
            category: "motherboard",
            label: "Anakart",
            brand: hw.motherboardComponent?.brandName ?? undefined,
            name: hw.motherboardComponent?.modelName ?? undefined,
            filled: !!hw.motherboardComponent,
        },
        {
            id: "psu",
            category: "psu",
            label: "Güç Kaynağı",
            filled: false,
        },
    ];
}

function mapHwToMissingInfo(hw: ApiUserHardwareResponse): MissingHardwareInfo {
    const items: string[] = [];
    if (!hw.cpuComponent) items.push("İşlemci");
    if (!hw.gpuComponent) items.push("Ekran Kartı");
    if (!hw.ramGb) items.push("RAM");
    if (!hw.storageGb) items.push("Depolama");
    if (!hw.motherboardComponent) items.push("Anakart");
    if (!hw.operatingSystem) items.push("İşletim Sistemi");
    return { count: items.length, items };
}

/*
 * Önerilen yükseltmeler — backend'de bu endpoint yok;
 * eksik alanlara göre dinamik öneriler üretilir.
 */
function buildUpgradeRecommendations(
    hw: ApiUserHardwareResponse,
): UpgradeRecommendation[] {
    const upgrades: UpgradeRecommendation[] = [];

    if (!hw.motherboardComponent) {
        upgrades.push({
            id: "motherboard",
            title: "Anakart Bilgisi",
            description:
                "Anakart bilgisi eklemek sistem uyumluluk analizini güçlendirir.",
            priority: "high",
        });
    }

    if (!hw.monitorComponent) {
        upgrades.push({
            id: "monitor",
            title: "Monitör Bilgisi",
            description:
                "Monitör çözünürlüğü ve yenileme hızı performans tahminini etkiler.",
            priority: "medium",
        });
    }

    if (!hw.operatingSystem) {
        upgrades.push({
            id: "os",
            title: "İşletim Sistemi",
            description:
                "İşletim sistemi bilgisi eklemek profil tamamlanma oranını artırır.",
            priority: "low",
        });
    }

    if (upgrades.length === 0) {
        upgrades.push({
            id: "fps",
            title: "FPS Raporu Ekle",
            description:
                "Oyun performansını kayıt altına almak için FPS raporu ekleyebilirsin.",
            priority: "low",
        });
    }

    return upgrades;
}

function mapReportToPerformanceExpectation(
    report: ApiGamePerformanceReport,
): PerformanceExpectation {
    const preset = formatPreset(report.graphicsPreset);
    const resolution = report.resolution ?? "";
    return {
        id: String(report.id),
        gameName: report.notes?.slice(0, 30) ?? `Oyun #${report.gameId}`,
        fpsLabel: report.averageFps
            ? `${report.averageFps} FPS`
            : "— FPS",
        settingLabel: [resolution, preset].filter(Boolean).join(" ") || "Bilinmiyor",
        percent: calcFpsPercent(report.averageFps, report.graphicsPreset),
        compatibilityLabel: resolveFpsCompatibility(report.averageFps),
    };
}

function mapReportToPerformancePrediction(
    report: ApiGamePerformanceReport,
): GamePerformancePrediction {
    const preset = formatPreset(report.graphicsPreset);
    const resolution = report.resolution ?? "";
    return {
        id: String(report.id),
        gameName: report.notes?.slice(0, 30) ?? `Oyun #${report.gameId}`,
        presetLabel: [resolution, preset].filter(Boolean).join(" ") || "Bilinmiyor",
        fps: report.averageFps ?? 0,
        targetFps: estimateTargetFps(report.graphicsPreset),
    };
}

function mapReportToFpsReport(
    report: ApiGamePerformanceReport,
    username: string,
): FpsReport {
    const parts = [
        report.gpuComponent?.modelName,
        report.cpuComponent?.modelName,
        report.ramGb ? `${report.ramGb}GB` : null,
    ].filter(Boolean);

    return {
        id: String(report.id),
        username: `@${username}`,
        gameName: report.notes?.slice(0, 30) ?? `Oyun #${report.gameId}`,
        fps: report.averageFps ?? 0,
        presetLabel: formatPreset(report.graphicsPreset),
        hardwareSummary: parts.join(" • ") || "—",
        timeAgo: formatRelativeTime(report.createdAt).toUpperCase(),
    };
}

function mapApiDealToFrontend(deal: ApiHardwareDeal): HardwareDeal {
    return {
        id: String(deal.id),
        name: deal.title,
        oldPrice: deal.oldPrice !== null
            ? formatPrice(deal.oldPrice, deal.currency)
            : "—",
        newPrice: formatPrice(deal.newPrice, deal.currency),
        discountLabel: formatDiscountLabel(deal.discountPercentage),
    };
}

function mapApiReviewToFrontend(review: ApiHardwareReview): HardwareReview {
    return {
        id: String(review.id),
        productName:
            review.component?.modelName ??
            review.title ??
            "Donanım İncelemesi",
        rating: review.rating,
    };
}

/* ────────────────────── statik (backend aggregate yok) içerik ─────────────── */

const STATIC_HERO = {
    statusBadge: "SİSTEM ANALİZİ AKTİF",
    title: "LTZ Donanım Servisi",
    description:
        "Sistemini analiz et, oyun performansını karşılaştır, donanım fırsatlarını yakala.",
    actions: [
        { label: "Sistemimi Güncelle", variant: "primary" as const },
        { label: "FPS Raporu Ekle", variant: "secondary" as const },
        { label: "İnceleme Yaz", variant: "secondary" as const },
        { label: "Kampanyaları Gör", variant: "secondary" as const },
    ],
};

const STATIC_STATS = [
    {
        id: "registered-systems",
        label: "Kayıtlı Sistemler",
        value: "—",
        trendLabel: "Veriler yükleniyor",
        trendDirection: "up" as const,
        tone: "violet" as const,
        icon: "cpu" as const,
        trendData: [38, 42, 40, 51, 58, 64, 72, 80],
    },
    {
        id: "fps-reports",
        label: "FPS Raporları",
        value: "—",
        trendLabel: "Veriler yükleniyor",
        trendDirection: "up" as const,
        tone: "cyan" as const,
        icon: "activity" as const,
        trendData: [22, 30, 28, 41, 48, 60, 71, 85],
    },
    {
        id: "active-deals",
        label: "Aktif Kampanyalar",
        value: "—",
        trendLabel: "Veriler yükleniyor",
        trendDirection: "up" as const,
        tone: "fuchsia" as const,
        icon: "tag" as const,
        trendData: [30, 28, 34, 32, 38, 36, 40, 42],
    },
    {
        id: "popular-components",
        label: "Popüler Bileşenler",
        value: "—",
        trendLabel: "Veriler yükleniyor",
        trendDirection: "up" as const,
        tone: "purple" as const,
        icon: "layers" as const,
        trendData: [44, 50, 48, 62, 70, 78, 88, 96],
    },
];

const STATIC_PERFORMANCE_FILTERS = [
    { id: "1080p", label: "1080p", group: "resolution" as const },
    { id: "1440p", label: "1440p", group: "resolution" as const },
    { id: "4k", label: "4K", group: "resolution" as const },
    { id: "low", label: "Düşük", group: "preset" as const },
    { id: "high", label: "Yüksek", group: "preset" as const },
    { id: "ultra", label: "Ultra", group: "preset" as const },
];

const EMPTY_SYSTEM_OVERVIEW: MySystemOverview = {
    specs: [
        { label: "GPU", value: "—", icon: "gpu" },
        { label: "CPU", value: "—", icon: "cpu" },
        { label: "RAM", value: "—", icon: "ram" },
        { label: "Depolama", value: "—", icon: "storage" },
    ],
    score: 0,
    scoreMax: 100,
    tierLabel: "Profil Kurulmadı",
    compatibility: [],
};

/* ─────────────────────── 404 handler (null döner) ────────────────────────── */

async function tryGetUserHardware(
    userId: number,
): Promise<ApiUserHardwareResponse | null> {
    try {
        return await apiClient.get<ApiUserHardwareResponse>(
            HARDWARE_API_ENDPOINTS.userHardware(userId),
        );
    } catch (error) {
        if (
            isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 403)
        ) {
            return null;
        }
        throw error;
    }
}

async function tryGetList<T>(endpoint: string): Promise<T[]> {
    try {
        return await apiClient.get<T[]>(endpoint);
    } catch {
        return [];
    }
}

/* ═══════════════════════════════ SERVICE ════════════════════════════════════ */

export const hardwareService = {
    /*
     * Hardware Center dashboard.
     *
     * Paralel çağrılar:
     *  - GET /api/hardware/users/{userId}         → MySystemOverview
     *  - GET /api/hardware/deals/active           → HardwareDeal[]
     *  - GET /api/hardware/performance-reports/users/{userId} → FPS tahminleri
     *  - GET /api/hardware/reviews/users/{userId} → HardwareReview[]
     */
    async getHardwareDashboard(userId: number): Promise<HardwareDashboardData> {
        const [hw, deals, reports, reviews] = await Promise.all([
            tryGetUserHardware(userId),
            tryGetList<ApiHardwareDeal>(HARDWARE_API_ENDPOINTS.dealsActive),
            tryGetList<ApiGamePerformanceReport>(
                HARDWARE_API_ENDPOINTS.performanceReportsByUser(userId),
            ),
            tryGetList<ApiHardwareReview>(
                HARDWARE_API_ENDPOINTS.reviewsByUser(userId),
            ),
        ]);

        return {
            hero: STATIC_HERO,
            stats: STATIC_STATS,
            mySystem: hw ? mapHwToMySystemOverview(hw) : EMPTY_SYSTEM_OVERVIEW,
            performanceFilters: STATIC_PERFORMANCE_FILTERS,
            activeFilterIds: ["1080p", "ultra"],
            performance: reports
                .slice(0, 4)
                .map(mapReportToPerformancePrediction),
            deals: deals.slice(0, 3).map(mapApiDealToFrontend),
            fpsReports: reports
                .slice(0, 2)
                .map((r) => mapReportToFpsReport(r, String(userId))),
            reviews: reviews.slice(0, 3).map(mapApiReviewToFrontend),
        };
    },

    /*
     * "Sistemim" detay sayfası.
     *
     * Paralel çağrılar:
     *  - GET /api/hardware/users/{userId}
     *  - GET /api/hardware/performance-reports/users/{userId}
     *
     * null → kullanıcı donanım profili oluşturmamış (404).
     */
    async getMySystem(userId: number): Promise<MySystemData | null> {
        const [hw, reports] = await Promise.all([
            tryGetUserHardware(userId),
            tryGetList<ApiGamePerformanceReport>(
                HARDWARE_API_ENDPOINTS.performanceReportsByUser(userId),
            ),
        ]);

        if (!hw) return null;

        return {
            summary: mapHwToSystemSummary(hw),
            score: mapHwToScoreBreakdown(hw),
            components: mapHwToComponents(hw),
            missing: mapHwToMissingInfo(hw),
            upgrades: buildUpgradeRecommendations(hw),
            performance: reports
                .slice(0, 4)
                .map(mapReportToPerformanceExpectation),
        };
    },

    /*
     * Kullanıcı donanım profilini oluştur veya güncelle.
     * POST ilk kayıt, PUT güncelleme; backend her ikisinde de aynı upsert mantığını çalıştırır.
     */
    async upsertUserHardware(
        userId: number,
        request: ApiUserHardwareUpsertRequest,
    ): Promise<ApiUserHardwareResponse> {
        return apiClient.post<ApiUserHardwareResponse, ApiUserHardwareUpsertRequest>(
            HARDWARE_API_ENDPOINTS.userHardware(userId),
            request,
        );
    },

    /*
     * Kullanıcı donanım profilini siler.
     */
    async deleteUserHardware(userId: number): Promise<void> {
        await apiClient.delete(HARDWARE_API_ENDPOINTS.userHardware(userId));
    },

    /*
     * Bileşen kataloğunda arama yapar (ManualHardwareForm için).
     * Hata durumunda boş dizi döner; UI sessizce boş liste gösterir.
     */
    async searchComponents(
        componentType: ApiComponentType,
        query: string,
        category?: ApiComponentCategory,
    ): Promise<ApiHardwareComponent[]> {
        if (!query.trim()) return [];
        try {
            return await apiClient.get<ApiHardwareComponent[]>(
                HARDWARE_API_ENDPOINTS.componentsSearch,
                {
                    componentType,
                    query,
                    ...(category ? { category } : {}),
                },
            );
        } catch {
            return [];
        }
    },

    /*
     * Ham UserHardwareResponse döner (form pre-fill için).
     * 404 → null (kullanıcının profili yok).
     */
    async getUserHardwareRaw(
        userId: number,
    ): Promise<ApiUserHardwareResponse | null> {
        return tryGetUserHardware(userId);
    },
};
