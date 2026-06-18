import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function Select({
    value,
    onValueChange,
    options,
    placeholder = "Seçiniz",
    disabled = false,
    className,
}: SelectProps) {
    const selected = options.find((o) => o.value === value);

    return (
        <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
            <RadixSelect.Trigger
                className={cn(
                    "flex h-12 w-full items-center justify-between gap-2 rounded-xl",
                    "border border-white/10 bg-slate-950/80 px-4",
                    "text-sm font-semibold text-white",
                    "transition-all duration-200 outline-none",
                    "hover:border-violet-400/50 hover:bg-slate-900/80",
                    "focus:border-violet-400/70 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
                    "data-[placeholder]:text-slate-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
            >
                <span className="flex items-center gap-2 truncate">
                    {selected?.icon}
                    <RadixSelect.Value placeholder={placeholder} />
                </span>
                <RadixSelect.Icon asChild>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </RadixSelect.Icon>
            </RadixSelect.Trigger>

            <RadixSelect.Portal>
                <RadixSelect.Content
                    className={cn(
                        "relative z-[9999] min-w-[var(--radix-select-trigger-width)]",
                        "overflow-hidden rounded-xl",
                        "border border-white/10 bg-slate-950/98 shadow-2xl shadow-black/70",
                        "backdrop-blur-xl",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                    )}
                    position="popper"
                    sideOffset={6}
                >
                    <RadixSelect.ScrollUpButton className="flex h-7 cursor-default items-center justify-center text-slate-400">
                        <ChevronUp className="h-4 w-4" />
                    </RadixSelect.ScrollUpButton>

                    <RadixSelect.Viewport className="p-1.5">
                        {options.map((option) => (
                            <RadixSelect.Item
                                key={option.value}
                                value={option.value}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center gap-2.5",
                                    "rounded-lg px-3 py-2.5 pr-9",
                                    "text-sm font-semibold text-slate-200 outline-none",
                                    "transition-colors duration-150",
                                    "data-[highlighted]:bg-violet-600/80 data-[highlighted]:text-white",
                                    "data-[state=checked]:bg-violet-600 data-[state=checked]:text-white",
                                )}
                            >
                                {option.icon && (
                                    <span className="shrink-0">{option.icon}</span>
                                )}
                                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                                <RadixSelect.ItemIndicator className="absolute right-2.5 flex items-center">
                                    <Check className="h-3.5 w-3.5" />
                                </RadixSelect.ItemIndicator>
                            </RadixSelect.Item>
                        ))}
                    </RadixSelect.Viewport>

                    <RadixSelect.ScrollDownButton className="flex h-7 cursor-default items-center justify-center text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                    </RadixSelect.ScrollDownButton>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    );
}
