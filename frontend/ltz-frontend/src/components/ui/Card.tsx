/*
 * Ortak glassmorphism kart kabuğu.
 * Neon çerçeve + blur + koyu transparan zemin. İçeriği children olarak alır.
 */

import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...rest }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-3xl border border-violet-400/35 bg-ltz-panel/70 backdrop-blur-2xl",
                "shadow-[0_0_80px_rgba(124,58,237,0.35)]",
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}
