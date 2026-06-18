import type { ReactNode } from "react";

import { Card } from "../../../components/ui/Card";

interface ContentEmptyStateProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export function ContentEmptyState({
    title,
    description,
    action,
}: ContentEmptyStateProps) {
    return (
        <Card className="border-white/10 bg-slate-950/55 p-8 text-center">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
                {description}
            </p>
            {action ? <div className="mt-6">{action}</div> : null}
        </Card>
    );
}
