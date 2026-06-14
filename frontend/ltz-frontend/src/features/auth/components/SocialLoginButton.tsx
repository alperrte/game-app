/*
 * Steam sosyal giriş butonu.
 *
 * Sağlayıcının OAuth endpoint'ine yönlendiren sosyal giriş butonu.
 */

import type { ReactNode } from "react";
import { Button } from "../../../components/ui/Button";

interface SocialLoginButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
}

export function SocialLoginButton({
    icon,
    label,
    onClick,
    className,
}: SocialLoginButtonProps) {
    return (
        <Button
            type="button"
            variant="social"
            className={`w-full ${className ?? ""}`}
            leftIcon={icon}
            onClick={onClick}
        >
            {label}
        </Button>
    );
}
