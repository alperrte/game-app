/*
 * Donanım bileşeni arama inputu (typeahead).
 *
 * Kullanıcı yazdıkça hardware-service bileşen kataloğunu arar (debounced 300ms).
 * Seçilen bileşenin id + modelName + brandName'i parent'a iletilir.
 * category prop'u klavye/fare/kulaklık gibi PERIPHERAL alt tiplerini filtrelemek için kullanılır.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "../../../utils/cn";
import { hardwareService } from "../services/hardwareService";
import type {
    ApiComponentCategory,
    ApiComponentType,
    ApiHardwareComponent,
} from "../types/hardware.types";

export interface ComponentSelection {
    id: number | null;
    modelName: string;
    brandName: string | null;
    isCustom?: boolean;
}

function toDisplayName(s: ComponentSelection): string {
    return [s.brandName, s.modelName].filter(Boolean).join(" ");
}

interface ComponentSearchInputProps {
    componentType: ApiComponentType;
    category?: ApiComponentCategory;
    selected: ComponentSelection | null;
    onChange: (result: ComponentSelection | null) => void;
    label: string;
    placeholder?: string;
}

export function ComponentSearchInput({
    componentType,
    category,
    selected,
    onChange,
    label,
    placeholder = "Marka veya model ara...",
}: ComponentSearchInputProps) {
    const [inputValue, setInputValue] = useState<string>(() =>
        selected ? toDisplayName(selected) : "",
    );
    const [results, setResults] = useState<ApiHardwareComponent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    /* selected prop dışarıdan değiştiğinde inputValue'yu senkronize et */
    useEffect(() => {
        setInputValue(selected ? toDisplayName(selected) : "");
    }, [selected]);

    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Dışarı tıklanınca dropdown kapanır */
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    /* Debounced API search */
    const triggerSearch = useCallback(
        (query: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            if (!query.trim()) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            debounceRef.current = setTimeout(async () => {
                setIsLoading(true);
                const data = await hardwareService.searchComponents(
                    componentType,
                    query,
                    category,
                );
                setResults(data.slice(0, 8));
                setIsOpen(data.length > 0);
                setIsLoading(false);
            }, 300);
        },
        [componentType, category],
    );

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setInputValue(val);
        /* Kullanıcı yazmaya başlayınca seçimi temizle */
        if (selected) onChange(null);
        triggerSearch(val);
    }

    function handleSelect(component: ApiHardwareComponent) {
        const sel: ComponentSelection = {
            id: component.id,
            modelName: component.modelName,
            brandName: component.brandName ?? null,
        };
        onChange(sel);
        setInputValue(
            [component.brandName, component.modelName].filter(Boolean).join(" "),
        );
        setResults([]);
        setIsOpen(false);
    }

    function handleClear() {
        onChange(null);
        setInputValue("");
        setResults([]);
        setIsOpen(false);
    }

    return (
        <div ref={containerRef} className="relative space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </label>

            <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    {isLoading ? (
                        <Loader2
                            size={14}
                            className="animate-spin text-violet-400"
                        />
                    ) : (
                        <Search size={14} />
                    )}
                </span>

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "h-11 w-full rounded-xl border bg-white/[0.03] pl-10 pr-9",
                        "text-sm font-medium text-white placeholder:text-slate-600",
                        "outline-none transition-all duration-200",
                        selected
                            ? "border-violet-400/50 shadow-[0_0_14px_rgba(147,51,234,0.18)]"
                            : "border-white/10 hover:border-white/20 focus:border-violet-400/60 focus:shadow-[0_0_14px_rgba(147,51,234,0.18)]",
                    )}
                />

                {(selected || inputValue) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                        aria-label="Seçimi temizle"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {selected && (
                <p className="text-[11px] font-medium text-violet-300/80">
                    ✓ Seçildi: {toDisplayName(selected)}
                </p>
            )}

            {isOpen && results.length > 0 && (
                <div
                    className={cn(
                        "absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto",
                        "rounded-xl border border-white/10 bg-slate-950/98",
                        "shadow-2xl shadow-black/70 backdrop-blur-xl",
                    )}
                >
                    {results.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            /* onMouseDown prevent blur before click */
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(c);
                            }}
                            className={cn(
                                "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left",
                                "transition-colors hover:bg-violet-600/20",
                            )}
                        >
                            {c.brandName && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-violet-400">
                                    {c.brandName}
                                </span>
                            )}
                            <span className="text-sm font-semibold text-slate-200">
                                {c.modelName}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
