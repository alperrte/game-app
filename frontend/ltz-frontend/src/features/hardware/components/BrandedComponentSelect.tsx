/*
 * Marka → Model cascade seçimi.
 *
 * Adım 1 — Marka dropdown (Intel / AMD).
 * Adım 2 — Model dropdown: seçili markanın bileşenleri series_name'e göre
 *           gruplandırılmış olarak gösterilir + üst kısımda arama.
 * Adım 3 — "Modelim listede yok" seçilince serbest metin girişi açılır.
 *           Bu durumda onChange({ id: null, modelName, brandName, isCustom: true })
 *           döner; form submit'te unverified component oluşturulur.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

import { cn } from "../../../utils/cn";
import { hardwareService } from "../services/hardwareService";
import type {
    ApiComponentCategory,
    ApiComponentType,
    ApiHardwareComponent,
} from "../types/hardware.types";
import type { ComponentSelection } from "./ComponentSearchInput";

/* ─── Tipler ─────────────────────────────────────────────────────────────── */

export interface BrandOption {
    label: string;
    brandName: string;
}

interface BrandedComponentSelectProps {
    componentType: ApiComponentType;
    category?: ApiComponentCategory;
    selected: ComponentSelection | null;
    onChange: (result: ComponentSelection | null) => void;
    label: string;
    placeholder?: string;
    brandOptions: BrandOption[];
    userId?: number;
}

interface GroupedComponents {
    seriesName: string;
    items: ApiHardwareComponent[];
}

/* ─── Yardımcılar ─────────────────────────────────────────────────────────── */

function toDisplayName(s: ComponentSelection): string {
    return [s.brandName, s.modelName].filter(Boolean).join(" ");
}

function groupBySeries(items: ApiHardwareComponent[]): GroupedComponents[] {
    const map = new Map<string, ApiHardwareComponent[]>();
    for (const item of items) {
        const key = item.seriesName ?? "Diğer";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([seriesName, list]) => ({
        seriesName,
        items: list,
    }));
}

function filterGroups(
    groups: GroupedComponents[],
    query: string,
): GroupedComponents[] {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
        .map((g) => ({
            ...g,
            items: g.items.filter(
                (c) =>
                    c.modelName.toLowerCase().includes(q) ||
                    (c.normalizedName ?? "").toLowerCase().includes(q) ||
                    (c.aliases ?? "").toLowerCase().includes(q),
            ),
        }))
        .filter((g) => g.items.length > 0);
}

/* ─── Alt bileşenler ─────────────────────────────────────────────────────── */

function BrandDropdown({
    options,
    value,
    onChange,
}: {
    options: BrandOption[];
    value: string | null;
    onChange: (v: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function outside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    const selected = options.find((o) => o.brandName === value);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-xl px-4",
                    "border bg-white/[0.03] text-sm font-medium",
                    "outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-violet-400/50",
                    value
                        ? "border-violet-400/50 text-white shadow-[0_0_14px_rgba(147,51,234,0.18)]"
                        : "border-white/10 text-slate-400 hover:border-white/20",
                )}
            >
                <span>{selected ? selected.label : "Marka Seçin"}</span>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-slate-500 transition-transform duration-200",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open && (
                <div
                    className={cn(
                        "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden",
                        "rounded-xl border border-white/10 bg-slate-950/98",
                        "shadow-2xl shadow-black/70 backdrop-blur-xl",
                    )}
                >
                    {value && (
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(null);
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-slate-500 hover:bg-white/5"
                        >
                            <X size={12} /> Seçimi Temizle
                        </button>
                    )}
                    {options.map((opt) => (
                        <button
                            key={opt.brandName}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(opt.brandName);
                                setOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center justify-between px-4 py-3 text-left",
                                "text-sm font-semibold transition-colors",
                                "hover:bg-violet-600/20",
                                value === opt.brandName
                                    ? "text-violet-300"
                                    : "text-slate-200",
                            )}
                        >
                            {opt.label}
                            {value === opt.brandName && (
                                <Check size={14} className="text-violet-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ModelDropdown({
    groups,
    selected,
    onSelect,
    onCustom,
    isLoading,
    searchPlaceholder,
}: {
    groups: GroupedComponents[];
    selected: ComponentSelection | null;
    onSelect: (c: ApiHardwareComponent) => void;
    onCustom: () => void;
    isLoading: boolean;
    searchPlaceholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function outside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    /* Marka değişince dropdown'ı kapat ve arama sıfırla */
    useEffect(() => {
        setOpen(false);
        setSearch("");
    }, [groups]);

    const filtered = filterGroups(groups, search);
    const totalCount = groups.reduce((s, g) => s + g.items.length, 0);

    const displayLabel = selected?.isCustom
        ? `${selected.brandName ? selected.brandName + " " : ""}${selected.modelName} (Elle girildi)`
        : selected
          ? toDisplayName(selected)
          : null;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (!isLoading) setOpen((p) => !p);
                }}
                disabled={isLoading}
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-xl px-4",
                    "border bg-white/[0.03] text-sm font-medium",
                    "outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-violet-400/50",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    selected
                        ? "border-violet-400/50 text-white shadow-[0_0_14px_rgba(147,51,234,0.18)]"
                        : "border-white/10 text-slate-400 hover:border-white/20",
                )}
            >
                <span className="truncate">
                    {isLoading ? (
                        <span className="flex items-center gap-2 text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Yükleniyor...
                        </span>
                    ) : (
                        displayLabel ?? `Model Seçin (${totalCount} model)`
                    )}
                </span>
                {isLoading ? null : (
                    <ChevronDown
                        size={16}
                        className={cn(
                            "shrink-0 text-slate-500 transition-transform duration-200",
                            open && "rotate-180",
                        )}
                    />
                )}
            </button>

            {open && (
                <div
                    className={cn(
                        "absolute left-0 right-0 top-full z-50 mt-1 flex flex-col",
                        "rounded-xl border border-white/10 bg-slate-950/98",
                        "shadow-2xl shadow-black/70 backdrop-blur-xl",
                        "max-h-72",
                    )}
                >
                    {/* Arama */}
                    <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
                        <Search size={13} className="shrink-0 text-slate-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder ?? "Model ara..."}
                            className={cn(
                                "min-w-0 flex-1 bg-transparent text-sm text-white",
                                "placeholder:text-slate-600 outline-none",
                            )}
                        />
                        {search && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSearch("");
                                }}
                                className="text-slate-500 hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Grup listesi */}
                    <div className="overflow-y-auto">
                        {filtered.length === 0 && (
                            <p className="px-4 py-3 text-sm text-slate-500">
                                Sonuç bulunamadı.
                            </p>
                        )}
                        {filtered.map((g) => (
                            <div key={g.seriesName}>
                                <div className="sticky top-0 bg-slate-950/98 px-4 py-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">
                                        {g.seriesName}
                                    </span>
                                </div>
                                {g.items.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onSelect(c);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between px-4 py-2 text-left",
                                            "transition-colors hover:bg-violet-600/20",
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-200">
                                                {c.modelName}
                                            </span>
                                            {(c.extraSpecs || c.coreCount) && (
                                                <span className="text-[10px] text-slate-500">
                                                    {[
                                                        c.extraSpecs,
                                                        c.coreCount
                                                            ? `${c.coreCount}C/${c.threadCount}T`
                                                            : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </span>
                                            )}
                                        </div>
                                        {selected?.id === c.id && (
                                            <Check
                                                size={14}
                                                className="shrink-0 text-violet-400"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}

                        {/* Elle gir seçeneği */}
                        <div className="border-t border-white/8">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onCustom();
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={cn(
                                    "flex w-full items-center gap-2 px-4 py-3 text-left",
                                    "text-sm text-slate-400 transition-colors",
                                    "hover:bg-white/5 hover:text-slate-200",
                                )}
                            >
                                <span className="text-lg leading-none text-slate-500">
                                    +
                                </span>
                                Modelim listede yok — Elle gir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Ana bileşen ────────────────────────────────────────────────────────── */

export function BrandedComponentSelect({
    componentType,
    category,
    selected,
    onChange,
    label,
    placeholder,
    brandOptions,
}: BrandedComponentSelectProps) {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(
        selected?.brandName ?? null,
    );
    const [groups, setGroups] = useState<GroupedComponents[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /* Elle giriş modu */
    const [isCustomMode, setIsCustomMode] = useState(
        selected?.isCustom ?? false,
    );
    const [customText, setCustomText] = useState(
        selected?.isCustom ? selected.modelName : "",
    );

    /* Marka seçilince backend'den yükle */
    const loadBrand = useCallback(
        async (brandName: string) => {
            setIsLoading(true);
            setGroups([]);
            const data = await hardwareService.searchComponents(
                componentType,
                brandName,
                category,
            );
            setGroups(groupBySeries(data));
            setIsLoading(false);
        },
        [componentType, category],
    );

    function handleBrandChange(brandName: string | null) {
        setSelectedBrand(brandName);
        setIsCustomMode(false);
        setCustomText("");
        onChange(null);
        if (brandName) loadBrand(brandName);
        else {
            setGroups([]);
        }
    }

    function handleModelSelect(component: ApiHardwareComponent) {
        setIsCustomMode(false);
        setCustomText("");
        onChange({
            id: component.id,
            modelName: component.modelName,
            brandName: component.brandName ?? null,
        });
    }

    function handleCustomMode() {
        setIsCustomMode(true);
        setCustomText("");
        onChange(null);
    }

    function handleCustomConfirm() {
        const trimmed = customText.trim();
        if (!trimmed) return;
        onChange({
            id: null,
            modelName: trimmed,
            brandName: selectedBrand,
            isCustom: true,
        });
    }

    function handleClear() {
        onChange(null);
        setIsCustomMode(false);
        setCustomText("");
    }

    /* ─── Render ────────────────────────────────────────────────────────── */
    return (
        <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </label>

            {/* Seçilmiş bileşen */}
            {selected && !isCustomMode && (
                <div
                    className={cn(
                        "flex h-11 items-center justify-between rounded-xl px-4",
                        "border border-violet-400/50 bg-white/[0.03]",
                        "shadow-[0_0_14px_rgba(147,51,234,0.18)]",
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <Check size={13} className="shrink-0 text-violet-400" />
                        <span className="truncate text-sm font-semibold text-white">
                            {toDisplayName(selected)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="ml-2 shrink-0 text-slate-500 hover:text-white"
                        aria-label="Temizle"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Marka + Model dropdown'ları */}
            {!selected && !isCustomMode && (
                <div className="grid grid-cols-2 gap-2">
                    <BrandDropdown
                        options={brandOptions}
                        value={selectedBrand}
                        onChange={handleBrandChange}
                    />
                    <ModelDropdown
                        groups={groups}
                        selected={selected}
                        onSelect={handleModelSelect}
                        onCustom={handleCustomMode}
                        isLoading={isLoading}
                        searchPlaceholder={placeholder}
                    />
                </div>
            )}

            {/* Elle giriş modu */}
            {isCustomMode && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {selectedBrand && (
                            <span className="text-[11px] font-bold text-violet-300">
                                {selectedBrand}
                            </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                            · Model adını girin
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustomMode(false);
                                setCustomText("");
                            }}
                            className="ml-auto text-[11px] text-slate-500 hover:text-slate-300"
                        >
                            İptal
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCustomConfirm();
                                }
                            }}
                            placeholder={placeholder ?? "Ör: Core i7-9700K"}
                            autoFocus
                            className={cn(
                                "h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4",
                                "text-sm font-medium text-white placeholder:text-slate-600",
                                "outline-none transition-all duration-200",
                                "focus:border-violet-400/60 focus:shadow-[0_0_14px_rgba(147,51,234,0.18)]",
                            )}
                        />
                        <button
                            type="button"
                            onClick={handleCustomConfirm}
                            disabled={!customText.trim()}
                            className={cn(
                                "inline-flex h-11 items-center gap-1.5 rounded-xl px-4",
                                "bg-violet-600/80 text-sm font-semibold text-white",
                                "transition-all hover:bg-violet-600",
                                "disabled:cursor-not-allowed disabled:opacity-40",
                            )}
                        >
                            <Check size={14} />
                            Onayla
                        </button>
                    </div>
                    <p className="text-[11px] text-amber-400/70">
                        Bu model sisteme eklenmek üzere işaretlenecek ve admin
                        onayına sunulacak.
                    </p>
                </div>
            )}

            {/* Seçilmiş custom bileşen gösterimi */}
            {selected?.isCustom && (
                <div
                    className={cn(
                        "flex h-11 items-center justify-between rounded-xl px-4",
                        "border border-amber-400/40 bg-amber-950/20",
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="text-xs text-amber-400">●</span>
                        <span className="truncate text-sm font-semibold text-white">
                            {toDisplayName(selected)}
                        </span>
                        <span className="text-[10px] text-amber-400/70">
                            (onay bekliyor)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="ml-2 shrink-0 text-slate-500 hover:text-white"
                        aria-label="Temizle"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
