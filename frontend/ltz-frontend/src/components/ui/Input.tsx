/*
 * Ortak input componenti.
 *
 * - Label + placeholder
 * - Opsiyonel sol icon
 * - Şifre alanları için göster/gizle toggle'ı (isPassword)
 * - Focus durumunda violet/fuchsia neon glow
 */

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
    icon?: ReactNode;
    error?: string;
    /*
     * Şifre dışı inputlar için HTML type (email, text vb.).
     * isPassword=true olduğunda bu değer yok sayılır.
     */
    type?: InputHTMLAttributes<HTMLInputElement>["type"];
    /*
     * true ise input bir şifre alanı gibi davranır ve göster/gizle butonu gösterir.
     */
    isPassword?: boolean;
}

export function Input({
    label,
    icon,
    error,
    type = "text",
    isPassword = false,
    className,
    id,
    ...rest
}: InputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-xs font-medium tracking-wide text-zinc-300"
                >
                    {label}
                </label>
            )}

            <div className="auth-input-shell relative">
                {icon && (
                    <span className="auth-input-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        {icon}
                    </span>
                )}

                <input
                    id={inputId}
                    type={inputType}
                    className={cn(
                        "auth-input h-12 w-full rounded-xl border border-white/10 bg-ltz-panel/80 text-white",
                        "placeholder:text-zinc-500",
                        "transition-all duration-200 outline-none",
                        "focus:border-violet-400/70 focus:shadow-[0_0_24px_rgba(168,85,247,0.25)]",
                        icon ? "pl-11" : "pl-4",
                        isPassword ? "pr-11" : "pr-4",
                        error && "border-red-500/60 focus:border-red-500/70",
                        className,
                    )}
                    {...rest}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-fuchsia-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60"
                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}
