/*
 * Ortak buton componenti.
 *
 * variant:
 *  - primary: ana CTA (mor/fuchsia gradient + neon glow)
 *  - ghost:   ince çerçeveli, arka planı şeffaf buton
 *  - social:  Steam/Discord gibi sosyal giriş butonları
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "ghost" | "social";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: cn(
        "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 text-white",
        "shadow-[0_0_32px_rgba(147,51,234,0.55)]",
        "hover:shadow-[0_0_44px_rgba(217,70,239,0.65)] hover:scale-[1.02]",
        "active:scale-[0.99]",
    ),
    ghost: cn(
        "border border-white/15 bg-white/[0.03] text-zinc-200",
        "hover:border-violet-400/60 hover:bg-white/[0.06]",
    ),
    social: cn(
        "border border-white/10 bg-white/[0.04] text-zinc-200",
        "hover:border-fuchsia-400/50 hover:bg-white/[0.07] hover:text-white",
    ),
};

export function Button({
    variant = "primary",
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5",
                "text-sm font-semibold tracking-wide",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
                variantClasses[variant],
                className,
            )}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                />
            ) : (
                leftIcon
            )}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
}
