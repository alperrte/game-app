/*
 * Manuel donanım profili oluşturma / güncelleme formu.
 *
 * Üç bölüm:
 *  - Temel Bileşenler: CPU, GPU, RAM, Depolama
 *  - Çevre Birimleri: Anakart, Monitör, Klavye, Fare, Kulaklık
 *  - Sistem Ayarları: İşletim sistemi, Çözünürlük, Yenileme hızı, Görünürlük
 *
 * existingData doluysa düzenleme modu (form pre-fill yapılır).
 * existingData null ise yeni profil oluşturma modudur.
 *
 * Kayıt başarılı → onSuccess() çağrılır; sayfa yeniden yükler.
 * İptal / geri → onCancel() çağrılır.
 */

import { useState } from "react";
import { ArrowLeft, Cpu, Loader2, MonitorCog, Save, Settings } from "lucide-react";

import { cn } from "../../../utils/cn";
import { Card } from "../../../components/ui/Card";
import { Select } from "../../../components/ui/Select";
import { hardwareService } from "../services/hardwareService";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { ComponentSearchInput } from "./ComponentSearchInput";
import type {
    ApiHardwareVisibility,
    ApiUserHardwareResponse,
} from "../types/hardware.types";
import type { ComponentSelection } from "./ComponentSearchInput";

/* ═══════════════════════════════ Form State ════════════════════════════════ */

interface FormState {
    cpu: ComponentSelection | null;
    gpu: ComponentSelection | null;
    ramGb: string;
    ramType: string;
    storageGb: string;
    storageType: string;
    motherboard: ComponentSelection | null;
    monitor: ComponentSelection | null;
    keyboard: ComponentSelection | null;
    mouse: ComponentSelection | null;
    headset: ComponentSelection | null;
    operatingSystem: string;
    monitorResolution: string;
    monitorRefreshRate: string;
    visibility: ApiHardwareVisibility;
}

function toSel(
    c: ApiUserHardwareResponse["cpuComponent"],
): ComponentSelection | null {
    if (!c) return null;
    return {
        id: c.id,
        modelName: c.modelName ?? "",
        brandName: c.brandName,
    };
}

function initForm(existing: ApiUserHardwareResponse | null): FormState {
    if (!existing) {
        return {
            cpu: null,
            gpu: null,
            ramGb: "",
            ramType: "",
            storageGb: "",
            storageType: "",
            motherboard: null,
            monitor: null,
            keyboard: null,
            mouse: null,
            headset: null,
            operatingSystem: "",
            monitorResolution: "",
            monitorRefreshRate: "",
            visibility: "PRIVATE",
        };
    }
    return {
        cpu: toSel(existing.cpuComponent),
        gpu: toSel(existing.gpuComponent),
        ramGb: existing.ramGb?.toString() ?? "",
        ramType: existing.ramType ?? "",
        storageGb: existing.storageGb?.toString() ?? "",
        storageType: existing.storageType ?? "",
        motherboard: toSel(existing.motherboardComponent),
        monitor: toSel(existing.monitorComponent),
        keyboard: toSel(existing.keyboardComponent),
        mouse: toSel(existing.mouseComponent),
        headset: toSel(existing.headsetComponent),
        operatingSystem: existing.operatingSystem ?? "",
        monitorResolution: existing.monitorResolution ?? "",
        monitorRefreshRate: existing.monitorRefreshRate?.toString() ?? "",
        visibility: existing.visibility ?? "PRIVATE",
    };
}

/* ═══════════════════════════════ Select Options ════════════════════════════ */

const RAM_TYPE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "DDR5", label: "DDR5" },
    { value: "DDR5E", label: "DDR5E" },
    { value: "DDR4", label: "DDR4" },
    { value: "DDR3", label: "DDR3" },
];

const STORAGE_TYPE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "NVMe SSD", label: "NVMe SSD" },
    { value: "SATA SSD", label: "SATA SSD" },
    { value: "M.2 SSD", label: "M.2 SSD" },
    { value: "HDD", label: "HDD" },
];

const OS_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "Windows 11", label: "Windows 11" },
    { value: "Windows 10", label: "Windows 10" },
    { value: "macOS Sonoma", label: "macOS Sonoma" },
    { value: "Ubuntu Linux", label: "Ubuntu Linux" },
    { value: "Fedora Linux", label: "Fedora Linux" },
    { value: "Diğer", label: "Diğer" },
];

const RESOLUTION_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "1920x1080", label: "1920×1080 (FHD)" },
    { value: "2560x1440", label: "2560×1440 (QHD)" },
    { value: "3840x2160", label: "3840×2160 (4K UHD)" },
    { value: "1280x720", label: "1280×720 (HD)" },
    { value: "2560x1080", label: "2560×1080 (Ultrawide)" },
    { value: "3440x1440", label: "3440×1440 (QHD Ultrawide)" },
];

const VISIBILITY_OPTIONS = [
    { value: "PRIVATE", label: "Gizli (Sadece Ben)" },
    { value: "FRIENDS_ONLY", label: "Arkadaşlarım" },
    { value: "PUBLIC", label: "Herkese Açık" },
];

/* ═══════════════════════════════ Mini Components ════════════════════════════ */

function SectionHeader({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4">
            <span
                className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    "border border-violet-400/30 bg-violet-500/10 text-violet-300",
                )}
            >
                {icon}
            </span>
            <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                {description && (
                    <p className="text-[11px] text-slate-500">{description}</p>
                )}
            </div>
        </div>
    );
}

function NumberInput({
    label,
    value,
    onChange,
    placeholder,
    suffix,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    suffix?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03]",
                        "text-sm font-medium text-white placeholder:text-slate-600",
                        "outline-none transition-all duration-200",
                        "hover:border-white/20",
                        "focus:border-violet-400/60 focus:shadow-[0_0_14px_rgba(147,51,234,0.18)]",
                        suffix ? "pl-4 pr-12" : "px-4",
                    )}
                />
                {suffix && (
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </label>
            <Select
                value={value}
                onValueChange={onChange}
                options={options}
                placeholder="Seçiniz"
            />
        </div>
    );
}

/* ═══════════════════════════════ Save Button ════════════════════════════════ */

function SaveButton({ saving }: { saving: boolean }) {
    return (
        <button
            type="submit"
            disabled={saving}
            className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6",
                "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600",
                "text-sm font-semibold text-white",
                "shadow-[0_0_28px_rgba(147,51,234,0.45)]",
                "transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(217,70,239,0.55)]",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
            )}
        >
            {saving ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Save size={16} />
            )}
            {saving ? "Kaydediliyor..." : "Sistemi Kaydet"}
        </button>
    );
}

/* ═══════════════════════════════ Main Component ════════════════════════════ */

interface ManualHardwareFormProps {
    userId: number;
    existingData: ApiUserHardwareResponse | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ManualHardwareForm({
    userId,
    existingData,
    onSuccess,
    onCancel,
}: ManualHardwareFormProps) {
    const [form, setForm] = useState<FormState>(() => initForm(existingData));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = !!existingData;

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await hardwareService.upsertUserHardware(userId, {
                cpuComponentId: form.cpu?.id ?? null,
                gpuComponentId: form.gpu?.id ?? null,
                ramGb: form.ramGb ? parseInt(form.ramGb, 10) : null,
                ramType: form.ramType || null,
                storageGb: form.storageGb ? parseInt(form.storageGb, 10) : null,
                storageType: form.storageType || null,
                motherboardComponentId: form.motherboard?.id ?? null,
                monitorComponentId: form.monitor?.id ?? null,
                keyboardComponentId: form.keyboard?.id ?? null,
                mouseComponentId: form.mouse?.id ?? null,
                headsetComponentId: form.headset?.id ?? null,
                operatingSystem: form.operatingSystem || null,
                monitorResolution: form.monitorResolution || null,
                monitorRefreshRate: form.monitorRefreshRate
                    ? parseInt(form.monitorRefreshRate, 10)
                    : null,
                visibility: form.visibility,
            });
            onSuccess();
        } catch (err) {
            setError(
                getErrorMessage(err, "Sistem bilgileri kaydedilemedi."),
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Form Header ─── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                            "border border-white/10 bg-white/[0.03] text-slate-400",
                            "transition-colors hover:border-violet-400/40 hover:text-white",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50",
                        )}
                        aria-label="Geri"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white">
                            {isEdit
                                ? "Sistem Bilgilerini Düzenle"
                                : "Sistemi Manuel Gir"}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {isEdit
                                ? "Mevcut donanım profilini güncelle"
                                : "Bileşenlerini girerek profil oluştur — boş bırakabilirsin"}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:block">
                    <SaveButton saving={saving} />
                </div>
            </div>

            {/* ─── İki Kolon: Temel + Çevre ─── */}
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                {/* Sol: Temel Bileşenler */}
                <Card className="p-6">
                    <SectionHeader
                        icon={<Cpu size={20} strokeWidth={2} />}
                        title="Temel Bileşenler"
                        description="CPU, GPU, RAM ve depolama"
                    />

                    <div className="space-y-4">
                        <ComponentSearchInput
                            componentType="CPU"
                            selected={form.cpu}
                            onChange={(v) => update("cpu", v)}
                            label="İşlemci (CPU)"
                            placeholder="Ör: Intel Core i7-13700K"
                        />

                        <ComponentSearchInput
                            componentType="GPU"
                            selected={form.gpu}
                            onChange={(v) => update("gpu", v)}
                            label="Ekran Kartı (GPU)"
                            placeholder="Ör: NVIDIA GeForce RTX 4070"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <NumberInput
                                label="RAM Kapasitesi"
                                value={form.ramGb}
                                onChange={(v) => update("ramGb", v)}
                                placeholder="32"
                                suffix="GB"
                            />
                            <SelectField
                                label="RAM Tipi"
                                value={form.ramType}
                                onChange={(v) => update("ramType", v)}
                                options={RAM_TYPE_OPTIONS}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <NumberInput
                                label="Depolama Kapasitesi"
                                value={form.storageGb}
                                onChange={(v) => update("storageGb", v)}
                                placeholder="1000"
                                suffix="GB"
                            />
                            <SelectField
                                label="Depolama Tipi"
                                value={form.storageType}
                                onChange={(v) => update("storageType", v)}
                                options={STORAGE_TYPE_OPTIONS}
                            />
                        </div>
                    </div>
                </Card>

                {/* Sağ: Çevre Birimleri */}
                <Card className="p-6">
                    <SectionHeader
                        icon={<MonitorCog size={20} strokeWidth={2} />}
                        title="Çevre Birimleri"
                        description="Anakart, monitör ve diğerleri"
                    />

                    <div className="space-y-4">
                        <ComponentSearchInput
                            componentType="MOTHERBOARD"
                            selected={form.motherboard}
                            onChange={(v) => update("motherboard", v)}
                            label="Anakart"
                            placeholder="Ör: ASUS ROG Strix B650E"
                        />

                        <ComponentSearchInput
                            componentType="MONITOR"
                            selected={form.monitor}
                            onChange={(v) => update("monitor", v)}
                            label="Monitör"
                            placeholder="Ör: LG 27GP850-B"
                        />

                        <ComponentSearchInput
                            componentType="PERIPHERAL"
                            category="KEYBOARD"
                            selected={form.keyboard}
                            onChange={(v) => update("keyboard", v)}
                            label="Klavye"
                            placeholder="Ör: Logitech G Pro X TKL"
                        />

                        <ComponentSearchInput
                            componentType="PERIPHERAL"
                            category="MOUSE"
                            selected={form.mouse}
                            onChange={(v) => update("mouse", v)}
                            label="Fare"
                            placeholder="Ör: Logitech G502 X Plus"
                        />

                        <ComponentSearchInput
                            componentType="PERIPHERAL"
                            category="HEADSET"
                            selected={form.headset}
                            onChange={(v) => update("headset", v)}
                            label="Kulaklık"
                            placeholder="Ör: SteelSeries Arctis Nova Pro"
                        />
                    </div>
                </Card>
            </div>

            {/* ─── Sistem Ayarları (tam genişlik) ─── */}
            <Card className="p-6">
                <SectionHeader
                    icon={<Settings size={20} strokeWidth={2} />}
                    title="Sistem Ayarları"
                    description="İşletim sistemi, ekran ve profil görünürlüğü"
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SelectField
                        label="İşletim Sistemi"
                        value={form.operatingSystem}
                        onChange={(v) => update("operatingSystem", v)}
                        options={OS_OPTIONS}
                    />

                    <SelectField
                        label="Monitör Çözünürlüğü"
                        value={form.monitorResolution}
                        onChange={(v) => update("monitorResolution", v)}
                        options={RESOLUTION_OPTIONS}
                    />

                    <NumberInput
                        label="Yenileme Hızı"
                        value={form.monitorRefreshRate}
                        onChange={(v) => update("monitorRefreshRate", v)}
                        placeholder="144"
                        suffix="Hz"
                    />

                    <SelectField
                        label="Profil Görünürlüğü"
                        value={form.visibility}
                        onChange={(v) =>
                            update("visibility", v as ApiHardwareVisibility)
                        }
                        options={VISIBILITY_OPTIONS}
                    />
                </div>
            </Card>

            {/* ─── Hata Mesajı ─── */}
            {error && (
                <Card className="border-red-400/30 bg-red-950/20 p-4 text-sm text-red-200">
                    {error}
                </Card>
            )}

            {/* ─── Alt Aksiyon Butonları ─── */}
            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5",
                        "border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-300",
                        "transition-all duration-200 hover:border-white/20 hover:text-white",
                        "disabled:opacity-50",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50",
                    )}
                >
                    İptal
                </button>

                <SaveButton saving={saving} />
            </div>
        </form>
    );
}
