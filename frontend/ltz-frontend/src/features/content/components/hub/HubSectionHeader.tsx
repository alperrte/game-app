import type { LucideIcon } from "lucide-react";

interface HubSectionHeaderProps {
    label: string;
    icon: LucideIcon;
}

export function HubSectionHeader({ label, icon: Icon }: HubSectionHeaderProps) {
    return (
        <div className="flex items-center gap-3 pb-1 pt-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                <Icon size={14} strokeWidth={2.5} className="text-violet-300" />
                {label}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
    );
}
