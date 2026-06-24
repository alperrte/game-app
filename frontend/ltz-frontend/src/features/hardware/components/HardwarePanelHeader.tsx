/*
 * Kart başlığı + opsiyonel "TÜMÜNÜ GÖR →" linki.
 * Hardware kartları arasında tekrar kullanılır.
 */

import { ArrowRight } from "lucide-react";

import { cn } from "../../../utils/cn";

interface HardwarePanelHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function HardwarePanelHeader({
    title,
    actionLabel,
    onAction,
    className,
}: HardwarePanelHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            <h2 className="text-base font-bold text-white">{title}</h2>

            {actionLabel ? (
                <button
                    type="button"
                    onClick={onAction}
                    className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                        "text-violet-300 transition-colors hover:text-fuchsia-300",
                    )}
                >
                    {actionLabel}
                    <ArrowRight size={12} />
                </button>
            ) : null}
        </div>
    );
}
