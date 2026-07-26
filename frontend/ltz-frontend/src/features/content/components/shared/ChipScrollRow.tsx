import type { ReactNode } from "react";

import { cn } from "../../../../utils/cn";

interface ChipScrollRowProps {
    children: ReactNode;
    className?: string;
}

/**
 * Horizontal scroll row for filter chips. Prevents chip rows from wrapping
 * to multiple lines on mobile (which pushes page height); edges fade via
 * mask-image so it works over any background instead of a hardcoded color.
 */
export function ChipScrollRow({ children, className }: ChipScrollRowProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 overflow-x-auto [&>*]:shrink-0",
                "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5",
                className,
            )}
            style={{
                maskImage:
                    "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
                WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            }}
        >
            {children}
        </div>
    );
}
