/*
 * Steam / Discord sosyal giriş butonu.
 *
 * NOT: auth-service içinde Steam/Discord OAuth endpoint'i YOKTUR.
 * Bu yüzden butonlar şimdilik yalnızca UI'dır (onClick TODO).
 */

import type { ReactNode } from "react";
import { Button } from "../../../components/ui/Button";

interface SocialLoginButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
}

export function SocialLoginButton({ icon, label, onClick }: SocialLoginButtonProps) {
    return (
        <Button
            type="button"
            variant="social"
            className="w-full"
            leftIcon={icon}
            onClick={onClick}
            // TODO: auth-service OAuth endpoint'i eklendiğinde gerçek akışa bağlanacak.
        >
            {label}
        </Button>
    );
}
