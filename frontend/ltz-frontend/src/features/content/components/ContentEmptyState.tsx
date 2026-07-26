import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

import { Card } from "../../../components/ui/Card";

interface ContentEmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: ReactNode;
}

export function ContentEmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
}: ContentEmptyStateProps) {
    return (
        <Card className="border-white/10 bg-slate-950/55 p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                <Icon size={26} strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-white">{title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
                {description}
            </p>
            {action ? <div className="mt-6">{action}</div> : null}
        </Card>
    );
}
