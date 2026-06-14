/*
 * Kesik köşeli, çift konturlu neon feature kartı.
 * Sol tarafta büyük bir ikon, yanında başlık ve açıklama yer alır.
 */

import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
    return (
        <div className="feature-card group flex min-h-24 cursor-default items-center gap-5 px-6 py-5">
            <span className="feature-card__icon flex h-14 w-14 shrink-0 items-center justify-center text-fuchsia-300 transition-all duration-300 group-hover:text-fuchsia-200">
                <Icon size={42} strokeWidth={1.55} />
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-medium text-white">{title}</h3>
                <p className="mt-0.5 truncate text-xs text-zinc-400">{description}</p>
            </div>
        </div>
    );
}
