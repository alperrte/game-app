/*
 * Login ve register sayfalarının paylaştığı görsel zemin.
 *
 * - Full-screen ltz-login-bg.png (karakter solda görünür kalır)
 * - Okunabilirlik overlay'leri
 * - Sağ üst dil seçici / sol alt online rozeti
 *
 * Sayfaya özel içerik (form paneli, feature kartları vb.) children olarak gelir
 * ve relative z-10 katmanında render edilir.
 */

import type { ReactNode } from "react";
import loginBg from "../../../assets/ltz-login-bg.png";
import { LanguageSelector } from "./LanguageSelector";
import { OnlineStatusBadge } from "./OnlineStatusBadge";

interface AuthBackdropProps {
    children: ReactNode;
}

export function AuthBackdrop({ children }: AuthBackdropProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-ltz-bg">
            {/* Arka plan görseli — karakteri korumak için sola hizalı, cover */}
            <div
                className="absolute inset-0 bg-cover bg-left bg-no-repeat"
                style={{ backgroundImage: `url(${loginBg})` }}
                aria-hidden="true"
            />

            {/* Okunabilirlik overlay'leri (arka planı/karakteri öldürmeyecek şiddette) */}
            <div
                className="absolute inset-0 bg-gradient-to-r from-ltz-bg/85 via-ltz-bg/40 to-ltz-bg/85"
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-ltz-bg/20" aria-hidden="true" />

            {/* Sağ üst: dil seçici */}
            <div className="absolute right-6 top-6 z-20">
                <LanguageSelector />
            </div>

            {/* Sol alt: online oyuncu rozeti */}
            <div className="absolute bottom-6 left-6 z-20">
                <OnlineStatusBadge />
            </div>

            {/* Sayfaya özel içerik */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
