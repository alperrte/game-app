/*
 * Tek bir neon feature kartı.
 * Sol tarafta icon, ortada başlık + açıklama, sağda chevron.
 * Hover'da hafif yukarı kalkma ve glow artışı.
 */

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
    return (
        <div
            className="group flex cursor-default items-center gap-4 rounded-3xl border border-violet-400/35 bg-ltz-card/55 px-5 py-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/60 hover:shadow-[0_0_42px_rgba(168,85,247,0.35)]"
        >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-fuchsia-300 transition-colors group-hover:text-fuchsia-200">
                <Icon size={22} />
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="truncate text-xs text-zinc-400">{description}</p>
            </div>

            <ChevronRight
                size={18}
                className="shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-fuchsia-300"
            />
        </div>
    );
}
