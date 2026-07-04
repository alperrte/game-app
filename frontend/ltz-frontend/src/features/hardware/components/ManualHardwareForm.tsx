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

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Cpu, ImagePlus, Loader2, MonitorCog, Plus, Save, Settings, Trash2, X } from "lucide-react";

import { cn } from "../../../utils/cn";
import { Card } from "../../../components/ui/Card";
import { Select } from "../../../components/ui/Select";
import { hardwareService } from "../services/hardwareService";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { socialService } from "../../social/services/socialService";
import { getImageUrl } from "../../user/utils/profileImage";
import { ComponentSearchInput } from "./ComponentSearchInput";
import { BrandedComponentSelect } from "./BrandedComponentSelect";
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
    ramFrequencyPreset: string;
    ramFrequencyCustom: string;
    ramClPreset: string;
    ramClCustom: string;
    storageDevices: StorageDeviceInput[];
    motherboardPlatform: string;
    motherboardChipset: string;
    rigImageUrl: string;
    monitor: ComponentSelection | null;
    keyboard: ComponentSelection | null;
    mouse: ComponentSelection | null;
    headset: ComponentSelection | null;
    operatingSystem: string;
    monitorResolution: string;
    monitorRefreshRate: string;
    visibility: ApiHardwareVisibility;
}

interface StorageDeviceInput {
    id: string;
    capacityGb: string;
    type: string;
}

function createStorageDevice(
    capacityGb = "",
    type = "",
): StorageDeviceInput {
    return {
        id: `storage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        capacityGb,
        type,
    };
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

function parseRamDetails(value?: string | null) {
    const ramType = value?.match(/\bDDR[345]\b/i)?.[0]?.toUpperCase() ?? "";
    const frequency = value?.match(/(\d{4,5})\s*MHz/i)?.[1] ?? "";
    const cl = value?.match(/\bCL\s*(\d{1,3})\b/i)?.[1] ?? "";

    return { ramType, frequency, cl };
}

function initForm(existing: ApiUserHardwareResponse | null): FormState {
    if (!existing) {
        return {
            cpu: null,
            gpu: null,
            ramGb: "",
            ramType: "",
            ramFrequencyPreset: "",
            ramFrequencyCustom: "",
            ramClPreset: "",
            ramClCustom: "",
            storageDevices: [createStorageDevice()],
            motherboardPlatform: "",
            motherboardChipset: "",
            rigImageUrl: "",
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

    const ramDetails = parseRamDetails(existing.ramType);
    const defaultFrequencies = RAM_FREQUENCY_BY_TYPE[ramDetails.ramType] ?? [];
    const defaultCls = RAM_CL_BY_TYPE[ramDetails.ramType] ?? [];
    const ramFrequencyPreset =
        ramDetails.frequency && !defaultFrequencies.includes(ramDetails.frequency)
            ? CUSTOM_VALUE
            : ramDetails.frequency;
    const ramClPreset =
        ramDetails.cl && !defaultCls.includes(ramDetails.cl)
            ? CUSTOM_VALUE
            : ramDetails.cl;

    return {
        cpu: toSel(existing.cpuComponent),
        gpu: toSel(existing.gpuComponent),
        ramGb: existing.ramGb?.toString() ?? "",
        ramType: ramDetails.ramType,
        ramFrequencyPreset,
        ramFrequencyCustom: ramFrequencyPreset === CUSTOM_VALUE ? ramDetails.frequency : "",
        ramClPreset,
        ramClCustom: ramClPreset === CUSTOM_VALUE ? ramDetails.cl : "",
        storageDevices: existing.storageGb
            ? [createStorageDevice(existing.storageGb.toString(), existing.storageType ?? "")]
            : [createStorageDevice()],
        motherboardPlatform: "",
        motherboardChipset: "",
        rigImageUrl: existing.rigImageUrl ?? "",
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
    { value: "DDR4", label: "DDR4" },
    { value: "DDR3", label: "DDR3" },
];

const CUSTOM_VALUE = "__CUSTOM__";

const RAM_FREQUENCY_BY_TYPE: Record<string, string[]> = {
    DDR3: ["1066", "1333", "1600", "1866", "2133"],
    DDR4: ["2133", "2400", "2666", "3000", "3200", "3600", "4000"],
    DDR5: ["4800", "5200", "5600", "6000", "6400", "7200", "8000"],
};

const RAM_CL_BY_TYPE: Record<string, string[]> = {
    DDR3: ["9", "10", "11", "12"],
    DDR4: ["14", "15", "16", "18", "19", "22"],
    DDR5: ["30", "32", "34", "36", "38", "40"],
};

const MOTHERBOARD_PLATFORM_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "AM5", label: "AMD AM5" },
    { value: "AM4", label: "AMD AM4" },
    { value: "INTEL_LGA1851", label: "Intel Core Ultra 200 (LGA1851)" },
    { value: "INTEL_LGA1700", label: "Intel 12/13/14. Nesil (LGA1700)" },
];

const MOTHERBOARD_CHIPSETS_BY_PLATFORM: Record<string, string[]> = {
    AM5: ["X870E", "X870", "B850", "B840", "X670E", "X670", "B650E", "B650", "A620"],
    AM4: ["X570", "B550", "A520", "X470", "B450", "A320"],
    INTEL_LGA1851: ["Z890", "B860", "H810"],
    INTEL_LGA1700: ["Z790", "H770", "B760", "Z690", "H670", "B660", "H610"],
};

function getMotherboardChipsetOptions(platform: string) {
    return [
        { value: "", label: "Chipset seçin" },
        ...(MOTHERBOARD_CHIPSETS_BY_PLATFORM[platform] ?? []).map((chipset) => ({
            value: chipset,
            label: chipset,
        })),
    ];
}

function buildRamNumberOptions(values: string[], suffix: string) {
    return [
        { value: "", label: "Seçilmedi" },
        ...values.map((value) => ({
            value,
            label: suffix ? `${value} ${suffix}` : value,
        })),
        { value: CUSTOM_VALUE, label: "Manuel gir" },
    ];
}

function getRamFrequencyOptions(ramType: string) {
    return buildRamNumberOptions(
        RAM_FREQUENCY_BY_TYPE[ramType] ?? ["1600", "2400", "3200", "4800", "6000"],
        "MHz",
    );
}

function getRamClOptions(ramType: string) {
    return buildRamNumberOptions(
        RAM_CL_BY_TYPE[ramType] ?? ["16", "18", "30", "32", "36"],
        "",
    );
}

const STORAGE_TYPE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "NVMe SSD", label: "NVMe SSD" },
    { value: "SATA SSD", label: "SATA SSD" },
    { value: "M.2 SSD", label: "M.2 SSD" },
    { value: "HDD", label: "HDD" },
];

const STORAGE_CAPACITY_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "128", label: "128 GB" },
    { value: "256", label: "256 GB" },
    { value: "500", label: "500 GB" },
    { value: "512", label: "512 GB" },
    { value: "1000", label: "1 TB" },
    { value: "2000", label: "2 TB" },
    { value: "4000", label: "4 TB" },
    { value: "8000", label: "8 TB" },
];

function formatStorageCapacityLabel(value: string): string {
    const capacityGb = parseInt(value, 10);
    if (!capacityGb) return value;
    return capacityGb >= 1000
        ? `${capacityGb / 1000} TB`
        : `${capacityGb} GB`;
}

function getStorageCapacityOptions(value: string) {
    if (
        !value ||
        STORAGE_CAPACITY_OPTIONS.some((option) => option.value === value)
    ) {
        return STORAGE_CAPACITY_OPTIONS;
    }

    return [
        ...STORAGE_CAPACITY_OPTIONS,
        { value, label: formatStorageCapacityLabel(value) },
    ];
}

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
                        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
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
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                </label>
            )}
            <Select
                value={value}
                onValueChange={onChange}
                options={options}
                placeholder="Seçiniz"
            />
        </div>
    );
}

function MotherboardChipsetSelect({
    platform,
    chipset,
    onPlatformChange,
    onChipsetChange,
}: {
    platform: string;
    chipset: string;
    onPlatformChange: (v: string) => void;
    onChipsetChange: (v: string) => void;
}) {
    function handlePlatformChange(value: string) {
        onPlatformChange(value);
        onChipsetChange("");
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
                label="Anakart Platformu"
                value={platform}
                onChange={handlePlatformChange}
                options={MOTHERBOARD_PLATFORM_OPTIONS}
            />
            <SelectField
                label="Anakart Chipset"
                value={chipset}
                onChange={onChipsetChange}
                options={getMotherboardChipsetOptions(platform)}
            />
        </div>
    );
}

/* ═══════════════════════════════ Rig Image Upload ══════════════════════════ */

const MAX_RIG_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function RigImageUpload({
    value,
    onChange,
}: {
    value: string;
    onChange: (url: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            setUploadError("JPG, PNG veya WEBP formatında bir görsel seçmelisin.");
            return;
        }
        if (file.size > MAX_RIG_IMAGE_SIZE) {
            setUploadError("Görsel en fazla 10 MB olabilir.");
            return;
        }

        setUploading(true);
        setUploadError(null);
        try {
            const result = await socialService.uploadImage(file);
            onChange(result.imageUrl);
        } catch {
            setUploadError("Görsel yüklenemedi, tekrar dene.");
        } finally {
            setUploading(false);
        }
    }

    const preview = value ? getImageUrl(value) : null;

    return (
        <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Rig Görseli
            </label>

            {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-violet-400/25">
                    <img
                        src={preview}
                        alt="Rig görseli"
                        className="h-52 w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        aria-label="Görseli kaldır"
                        className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                        "flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl",
                        "border border-dashed border-violet-400/30 bg-white/[0.02]",
                        "text-slate-400 transition-colors hover:border-violet-400/60 hover:text-white",
                        "disabled:opacity-60",
                    )}
                >
                    {uploading ? (
                        <Loader2 size={24} className="animate-spin text-violet-400" />
                    ) : (
                        <ImagePlus size={24} />
                    )}
                    <span className="text-xs font-semibold">
                        {uploading ? "Yükleniyor..." : "Sisteminizin fotoğrafını yükleyin"}
                    </span>
                    <span className="text-[10px] text-slate-600">JPG, PNG, WEBP — max 10 MB</span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleFile(e)}
            />

            {uploadError && (
                <p className="text-[11px] text-red-300">{uploadError}</p>
            )}
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

    function updateRamType(value: string) {
        setForm((prev) => ({
            ...prev,
            ramType: value,
            ramFrequencyPreset: "",
            ramFrequencyCustom: "",
            ramClPreset: "",
            ramClCustom: "",
        }));
    }

    function updateStorageDevice(
        id: string,
        field: keyof Omit<StorageDeviceInput, "id">,
        value: string,
    ) {
        setForm((prev) => ({
            ...prev,
            storageDevices: prev.storageDevices.map((device) =>
                device.id === id ? { ...device, [field]: value } : device,
            ),
        }));
    }

    function addStorageDevice() {
        setForm((prev) => ({
            ...prev,
            storageDevices: [...prev.storageDevices, createStorageDevice()],
        }));
    }

    function removeStorageDevice(id: string) {
        setForm((prev) => ({
            ...prev,
            storageDevices:
                prev.storageDevices.length > 1
                    ? prev.storageDevices.filter((device) => device.id !== id)
                    : [createStorageDevice()],
        }));
    }

    function resolveStorageSummary() {
        const filledDevices = form.storageDevices.filter(
            (device) => device.capacityGb,
        );
        const totalGb = filledDevices.reduce(
            (sum, device) => sum + (parseInt(device.capacityGb, 10) || 0),
            0,
        );
        const typeSummary = Array.from(
            new Set(filledDevices.map((device) => device.type).filter(Boolean)),
        ).join(" + ");

        return {
            storageGb: totalGb > 0 ? totalGb : null,
            storageType: typeSummary || null,
        };
    }

    async function resolveComponentId(
        sel: import("./ComponentSearchInput").ComponentSelection | null,
        componentType: import("../types/hardware.types").ApiComponentType,
        category: import("../types/hardware.types").ApiComponentCategory,
    ): Promise<number | null> {
        if (!sel) return null;
        if (!sel.isCustom) return sel.id;
        const created = await hardwareService.createUnverifiedComponent(
            componentType,
            category,
            sel.modelName,
            sel.brandName,
            userId,
        );
        return created.id;
    }

    function resolveRamTypeSummary(): string | null {
        const parts = [
            form.ramType,
            form.ramFrequencyPreset === CUSTOM_VALUE
                ? form.ramFrequencyCustom
                    ? `${form.ramFrequencyCustom}MHz`
                    : null
                : form.ramFrequencyPreset
                  ? `${form.ramFrequencyPreset}MHz`
                  : null,
            form.ramClPreset === CUSTOM_VALUE
                ? form.ramClCustom
                    ? `CL${form.ramClCustom}`
                    : null
                : form.ramClPreset
                  ? `CL${form.ramClPreset}`
                  : null,
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(" ") : null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const [cpuId, gpuId] = await Promise.all([
                resolveComponentId(form.cpu, "CPU", "PROCESSOR"),
                resolveComponentId(form.gpu, "GPU", "GRAPHICS_CARD"),
            ]);
            const storageSummary = resolveStorageSummary();

            await hardwareService.upsertUserHardware(userId, {
                cpuComponentId: cpuId ?? null,
                gpuComponentId: gpuId ?? null,
                ramGb: form.ramGb ? parseInt(form.ramGb, 10) : null,
                ramType: resolveRamTypeSummary(),
                storageGb: storageSummary.storageGb,
                storageType: storageSummary.storageType,
                motherboardComponentId: null,
                rigImageUrl: form.rigImageUrl || null,
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
                        <BrandedComponentSelect
                            componentType="CPU"
                            selected={form.cpu}
                            onChange={(v) => update("cpu", v)}
                            label="İşlemci (CPU)"
                            placeholder="Model ara... (ör: i7-14700K, Ryzen 7 7700X)"
                            brandOptions={[
                                { label: "Intel İşlemcileri", brandName: "Intel" },
                                { label: "AMD İşlemcileri", brandName: "AMD" },
                            ]}
                        />

                        <BrandedComponentSelect
                            componentType="GPU"
                            selected={form.gpu}
                            onChange={(v) => update("gpu", v)}
                            label="Ekran Kartı (GPU)"
                            placeholder="Model ara... (ör: RTX 4070, RX 7900 XT, Arc B580)"
                            brandOptions={[
                                { label: "NVIDIA", brandName: "NVIDIA" },
                                { label: "Intel", brandName: "Intel" },
                                { label: "AMD", brandName: "AMD" },
                            ]}
                        />

                        <MotherboardChipsetSelect
                            platform={form.motherboardPlatform}
                            chipset={form.motherboardChipset}
                            onPlatformChange={(v) => update("motherboardPlatform", v)}
                            onChipsetChange={(v) => update("motherboardChipset", v)}
                        />

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                                onChange={updateRamType}
                                options={RAM_TYPE_OPTIONS}
                            />
                            <SelectField
                                label="RAM Frekansı"
                                value={form.ramFrequencyPreset}
                                onChange={(v) => update("ramFrequencyPreset", v)}
                                options={getRamFrequencyOptions(form.ramType)}
                            />
                            <SelectField
                                label="CL Değeri"
                                value={form.ramClPreset}
                                onChange={(v) => update("ramClPreset", v)}
                                options={getRamClOptions(form.ramType)}
                            />
                        </div>

                        {(form.ramFrequencyPreset === CUSTOM_VALUE ||
                            form.ramClPreset === CUSTOM_VALUE) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {form.ramFrequencyPreset === CUSTOM_VALUE && (
                                    <NumberInput
                                        label="RAM Frekansı (Manuel)"
                                        value={form.ramFrequencyCustom}
                                        onChange={(v) => update("ramFrequencyCustom", v)}
                                        placeholder="6000"
                                        suffix="MHz"
                                    />
                                )}
                                {form.ramClPreset === CUSTOM_VALUE && (
                                    <NumberInput
                                        label="CL Değeri (Manuel)"
                                        value={form.ramClCustom}
                                        onChange={(v) => update("ramClCustom", v)}
                                        placeholder="30"
                                    />
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Depolama
                                </span>
                                <button
                                    type="button"
                                    onClick={addStorageDevice}
                                    aria-label="Yeni depolama satırı ekle"
                                    className={cn(
                                        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3",
                                        "border border-violet-400/30 bg-violet-500/10",
                                        "text-xs font-semibold text-violet-200 transition-colors",
                                        "hover:border-violet-300/60 hover:bg-violet-500/20",
                                    )}
                                >
                                    <Plus size={13} />
                                    Depolama ekle
                                </button>
                            </div>

                            <div className="space-y-2">
                                {form.storageDevices.map((device, index) => (
                                    <div
                                        key={device.id}
                                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2"
                                    >
                                        <SelectField
                                            label={index === 0 ? "Kapasite" : ""}
                                            value={device.capacityGb}
                                            onChange={(v) =>
                                                updateStorageDevice(device.id, "capacityGb", v)
                                            }
                                            options={getStorageCapacityOptions(device.capacityGb)}
                                        />
                                        <SelectField
                                            label={index === 0 ? "Tip" : ""}
                                            value={device.type}
                                            onChange={(v) =>
                                                updateStorageDevice(device.id, "type", v)
                                            }
                                            options={STORAGE_TYPE_OPTIONS}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStorageDevice(device.id)}
                                            aria-label="Depolama satırını kaldır"
                                            className={cn(
                                                "mt-[1.625rem] grid h-11 w-11 place-items-center rounded-xl",
                                                "border border-white/10 bg-white/[0.03] text-slate-400",
                                                "transition-colors hover:border-red-400/50 hover:text-red-300",
                                                index !== 0 && "mt-0",
                                            )}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <RigImageUpload
                            value={form.rigImageUrl}
                            onChange={(url) => update("rigImageUrl", url)}
                        />
                    </div>
                </Card>

                {/* Sağ: Çevre Birimleri */}
                <Card className="p-6">
                    <SectionHeader
                        icon={<MonitorCog size={20} strokeWidth={2} />}
                        title="Çevre Birimleri"
                        description="Monitör ve diğer ekipmanlar"
                    />

                    <div className="space-y-4">
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
