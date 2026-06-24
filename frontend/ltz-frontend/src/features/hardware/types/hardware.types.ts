/*
 * Hardware Center modülünün veri tipleri.
 *
 * İki katmanlı tip sistemi:
 *  - Api* tipleri: backend DTO'larıyla birebir eşleşen ham yanıt tipleri.
 *  - Diğerleri: UI componentlerinin tükettiği, serviste mapping'den çıkan tipler.
 */

/* ================================================================== *
 * BACKEND API RESPONSE TİPLERİ (hardware-service DTO'larıyla birebir)
 * ================================================================== */

export type ApiComponentType =
    | "CPU"
    | "GPU"
    | "RAM"
    | "STORAGE"
    | "MOTHERBOARD"
    | "MONITOR"
    | "PERIPHERAL"
    | "OTHER";

export type ApiComponentCategory =
    | "PROCESSOR"
    | "GRAPHICS_CARD"
    | "MEMORY"
    | "SSD"
    | "HDD"
    | "MOTHERBOARD"
    | "KEYBOARD"
    | "MOUSE"
    | "HEADSET"
    | "MICROPHONE"
    | "CONTROLLER"
    | "MONITOR"
    | "OTHER";

export type ApiGraphicsPreset =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "ULTRA"
    | "CUSTOM";

export type ApiUpscalingType =
    | "NONE"
    | "DLSS"
    | "FSR"
    | "XESS"
    | "TSR"
    | "OTHER";

export type ApiHardwareVisibility =
    | "PUBLIC"
    | "FRIENDS_ONLY"
    | "PRIVATE";

/*
 * HardwareComponentSummaryResponse — UserHardware içindeki kısa bileşen özetleri.
 */
export interface ApiHardwareComponentSummary {
    id: number;
    componentType: ApiComponentType;
    category: ApiComponentCategory;
    brandName: string | null;
    seriesName: string | null;
    modelName: string | null;
    imageUrl: string | null;
    verified: boolean;
}

/*
 * HardwareComponentResponse — tam bileşen detayı (/api/hardware/components).
 */
export interface ApiHardwareComponent {
    id: number;
    componentType: ApiComponentType;
    category: ApiComponentCategory;
    brandId: number | null;
    brandName: string | null;
    seriesName: string | null;
    modelName: string;
    normalizedName: string | null;
    aliases: string | null;
    imageUrl: string | null;
    verified: boolean;
    createdByUserId: number | null;
    vramGb: number | null;
    coreCount: number | null;
    threadCount: number | null;
    memoryGb: number | null;
    storageCapacityGb: number | null;
    extraSpecs: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

/*
 * UserHardwareResponse — GET /api/hardware/users/{userId}
 * 404 → kullanıcının donanım profili henüz oluşturulmamış.
 */
export interface ApiUserHardwareResponse {
    id: number;
    userId: number;
    cpuComponent: ApiHardwareComponentSummary | null;
    gpuComponent: ApiHardwareComponentSummary | null;
    ramGb: number | null;
    ramType: string | null;
    storageGb: number | null;
    storageType: string | null;
    motherboardComponent: ApiHardwareComponentSummary | null;
    monitorComponent: ApiHardwareComponentSummary | null;
    keyboardComponent: ApiHardwareComponentSummary | null;
    mouseComponent: ApiHardwareComponentSummary | null;
    headsetComponent: ApiHardwareComponentSummary | null;
    operatingSystem: string | null;
    monitorResolution: string | null;
    monitorRefreshRate: number | null;
    visibility: ApiHardwareVisibility;
    createdAt: string;
    updatedAt: string;
}

/*
 * UserHardwareUpsertRequest — POST/PUT /api/hardware/users/{userId}
 */
export interface ApiUserHardwareUpsertRequest {
    cpuComponentId?: number | null;
    gpuComponentId?: number | null;
    ramGb?: number | null;
    ramType?: string | null;
    storageGb?: number | null;
    storageType?: string | null;
    motherboardComponentId?: number | null;
    monitorComponentId?: number | null;
    keyboardComponentId?: number | null;
    mouseComponentId?: number | null;
    headsetComponentId?: number | null;
    operatingSystem?: string | null;
    monitorResolution?: string | null;
    monitorRefreshRate?: number | null;
    visibility?: ApiHardwareVisibility;
}

/*
 * HardwareDealResponse — GET /api/hardware/deals/active
 * oldPrice ve newPrice backend'de BigDecimal olarak gelir;
 * JSON'da number olarak deserialize edilir.
 */
export interface ApiHardwareDeal {
    id: number;
    component: ApiHardwareComponentSummary | null;
    title: string;
    storeName: string | null;
    oldPrice: number | null;
    newPrice: number;
    currency: string | null;
    discountPercentage: number | null;
    dealUrl: string | null;
    sourceType: string | null;
    active: boolean;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

/*
 * HardwareReviewResponse — GET /api/hardware/reviews/users/{userId}
 */
export interface ApiHardwareReview {
    id: number;
    userId: number;
    component: ApiHardwareComponentSummary;
    reviewType: string;
    rating: number;
    title: string | null;
    content: string | null;
    pros: string | null;
    cons: string | null;
    usageDurationMonths: number | null;
    verifiedOwner: boolean;
    likeCount: number;
    reportCount: number;
    createdAt: string;
    updatedAt: string;
}

/*
 * GamePerformanceReportResponse — GET /api/hardware/performance-reports/users/{userId}
 * gameId ile oyun adına sadece game-service üzerinden ulaşılabilir;
 * bu serviste gameName yoktur.
 */
export interface ApiGamePerformanceReport {
    id: number;
    userId: number;
    gameId: number;
    reviewId: number | null;
    cpuComponent: ApiHardwareComponentSummary | null;
    gpuComponent: ApiHardwareComponentSummary | null;
    ramGb: number | null;
    resolution: string | null;
    graphicsPreset: ApiGraphicsPreset | null;
    averageFps: number | null;
    minimumFps: number | null;
    maximumFps: number | null;
    rayTracingEnabled: boolean | null;
    upscalingType: ApiUpscalingType | null;
    driverVersion: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

/* ================================================================== */

/*
 * Hero bölümündeki aksiyon butonu.
 * variant, primary CTA ile secondary butonları ayırmak için kullanılır.
 */
export interface HardwareHeroAction {
    label: string;
    variant: "primary" | "secondary";
}

/*
 * Hero içeriği (başlık, durum rozeti, açıklama, butonlar).
 */
export interface HardwareHeroContent {
    statusBadge: string;
    title: string;
    description: string;
    actions: HardwareHeroAction[];
}

/*
 * Trend yönü, stat kartındaki rozet rengini belirler.
 */
export type HardwareTrendDirection = "up" | "down";

/*
 * Üst bölümdeki özet istatistik kartı.
 */
export interface HardwareStat {
    id: string;
    label: string;
    value: string;
    trendLabel: string;
    trendDirection: HardwareTrendDirection;
    /* lucide ikon adı yerine tone ile renk teması verilir */
    tone: "violet" | "fuchsia" | "cyan" | "purple";
    icon: "cpu" | "activity" | "tag" | "layers";
    /* Karttaki mini sparkline için son dönem değerleri (eski → yeni) */
    trendData: number[];
}

/*
 * Kullanıcının kayıtlı sisteminin bir donanım satırı.
 */
export interface SystemSpec {
    label: string;
    value: string;
    icon: "gpu" | "cpu" | "ram" | "storage";
}

/*
 * Sistem uyumluluk rozeti (ör. "1080p Ultra Ready").
 */
export interface SystemCompatibilityBadge {
    label: string;
    tone: "violet" | "cyan" | "fuchsia";
}

/*
 * "Benim Sistemim" kartının tüm verisi.
 */
export interface MySystemOverview {
    specs: SystemSpec[];
    score: number;
    scoreMax: number;
    tierLabel: string;
    compatibility: SystemCompatibilityBadge[];
}

/*
 * Performans tahmini ekranındaki filtre pill'i.
 */
export interface PerformanceFilter {
    id: string;
    label: string;
    group: "resolution" | "preset";
}

/*
 * Tek bir oyunun tahmini performans satırı.
 */
export interface GamePerformancePrediction {
    id: string;
    gameName: string;
    presetLabel: string;
    fps: number;
    /*
     * Bu oyun için "tam dolu bar" sayılan hedef FPS.
     * Bar doluluğu fps / targetFps ile hesaplanır; böylece
     * competitive (ör. 360) ve AAA (ör. 120) oyunlar adil kıyaslanır.
     */
    targetFps: number;
}

/*
 * Kampanya / fırsat kartındaki ürün.
 */
export interface HardwareDeal {
    id: string;
    name: string;
    oldPrice: string;
    newPrice: string;
    discountLabel: string;
}

/*
 * Topluluktan gelen FPS raporu.
 */
export interface FpsReport {
    id: string;
    username: string;
    gameName: string;
    fps: number;
    presetLabel: string;
    hardwareSummary: string;
    timeAgo: string;
}

/*
 * Popüler donanım incelemesi.
 */
export interface HardwareReview {
    id: string;
    productName: string;
    rating: number;
}

/*
 * Hardware Center dashboard'unun tüm verisini tek tipte toplar.
 * Service bağlandığında bu tip dönecek şekilde tasarlanmıştır.
 */
export interface HardwareDashboardData {
    hero: HardwareHeroContent;
    stats: HardwareStat[];
    mySystem: MySystemOverview;
    performanceFilters: PerformanceFilter[];
    activeFilterIds: string[];
    performance: GamePerformancePrediction[];
    deals: HardwareDeal[];
    fpsReports: FpsReport[];
    reviews: HardwareReview[];
}

/* ------------------------------------------------------------------ *
 * "Sistemim" (My System) detay sayfası tipleri.
 *
 * Bu tipler dashboard tipleriyle aynı tasarım diline uyar; SystemSpec
 * ve SystemCompatibilityBadge gibi ortak tipler tekrar kullanılır.
 * ------------------------------------------------------------------ */

/*
 * Sayfa üst özetinin ve ana sistem kartının ortak verisi.
 */
export interface SystemSummary {
    /* Sistemin takma adı, ör. "Titan" */
    name: string;
    /* "Son güncelleme: 2 gün önce" için hazır etiket */
    lastUpdatedLabel: string;
    /* Profil tamamlanma oranı (0-100) */
    completionRate: number;
    /* Üstte gösterilen donanım özet chipleri */
    chips: SystemSpec[];
    /* Uyumluluk rozetleri (1080p Ultra Ready vb.) */
    compatibility: SystemCompatibilityBadge[];
}

/*
 * Bir donanım bileşeninin kategori anahtarı.
 * İkon eşlemesi component tarafında bu anahtara göre yapılır.
 */
export type HardwareComponentCategory =
    | "gpu"
    | "cpu"
    | "ram"
    | "storage"
    | "motherboard"
    | "psu";

/*
 * Düzenlenebilir tek bir donanım bileşeni kartının verisi.
 * Bilgi henüz eklenmemişse filled=false olur ve kart "Bilgi Eklenmedi"
 * durumunu gösterir.
 */
export interface HardwareComponent {
    id: string;
    category: HardwareComponentCategory;
    /* Küçük uppercase micro label, ör. "Ekran Kartı" */
    label: string;
    /* Marka satırı, ör. "NVIDIA GeForce" */
    brand?: string;
    /* Bileşen adı, ör. "RTX 4070 Ti Super" */
    name?: string;
    /* Teknik özellikler, ör. "16GB GDDR6X, 256-bit" */
    specs?: string;
    /* Bilgi eklenmiş mi */
    filled: boolean;
}

/*
 * Sistem skoru kırılım barı (ör. "Oyun Performansı: %92").
 */
export interface SystemScoreBreakdownItem {
    label: string;
    /* 0-100 arası yüzde */
    value: number;
    tone: "violet" | "cyan" | "fuchsia";
}

/*
 * LTZ Sistem Skoru kartının tüm verisi.
 */
export interface SystemScoreBreakdown {
    score: number;
    scoreMax: number;
    tierLabel: string;
    breakdown: SystemScoreBreakdownItem[];
}

/*
 * Eksik donanım bilgileri kartının verisi.
 */
export interface MissingHardwareInfo {
    count: number;
    items: string[];
}

/*
 * Önerilen yükseltme önceliği.
 */
export type UpgradePriority = "high" | "medium" | "low";

/*
 * Tek bir önerilen yükseltme satırı.
 */
export interface UpgradeRecommendation {
    id: string;
    title: string;
    description: string;
    priority: UpgradePriority;
}

/*
 * "Performans Beklentisi" bölümündeki tek bir oyun kartı.
 */
export interface PerformanceExpectation {
    id: string;
    gameName: string;
    /* FPS rozeti metni, ör. "320+ FPS" */
    fpsLabel: string;
    /* Önerilen ayar rozeti, ör. "1080p Yüksek" */
    settingLabel: string;
    /* Neon performans barı doluluğu (0-100) */
    percent: number;
    /* Uyumluluk durumu etiketi, ör. "Mükemmel" */
    compatibilityLabel: string;
}

/*
 * "Sistemim" sayfasının tüm verisini tek tipte toplar.
 * Service bağlandığında bu tip dönecek şekilde tasarlanmıştır.
 */
export interface MySystemData {
    summary: SystemSummary;
    score: SystemScoreBreakdown;
    components: HardwareComponent[];
    missing: MissingHardwareInfo;
    upgrades: UpgradeRecommendation[];
    performance: PerformanceExpectation[];
}
