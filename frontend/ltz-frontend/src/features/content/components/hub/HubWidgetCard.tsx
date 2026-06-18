import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { Card } from "../../../../components/ui/Card";
import { cn } from "../../../../utils/cn";

interface HubWidgetCardProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    action?: {
        label: string;
        href: string;
    };
}

export function HubWidgetCard({
    title,
    subtitle,
    icon: Icon,
    children,
    className,
    contentClassName,
    action,
}: HubWidgetCardProps) {
    return (
        <Card
            className={cn(
                "overflow-hidden border-white/10 bg-slate-950/55 shadow-[0_22px_90px_rgba(0,0,0,0.28)]",
                className,
            )}
        >
            <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/35 bg-violet-500/10 text-violet-200">
                            <Icon size={18} strokeWidth={2.25} />
                        </span>

                        <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-white">
                                {title}
                            </h3>
                            {subtitle ? (
                                <p className="truncate text-xs text-slate-400">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {action ? (
                        <Link
                            to={action.href}
                            className="shrink-0 text-xs font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
                        >
                            {action.label} →
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className={cn("p-5", contentClassName)}>{children}</div>
        </Card>
    );
}
