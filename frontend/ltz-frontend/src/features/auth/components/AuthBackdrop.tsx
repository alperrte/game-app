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
import { motion, useReducedMotion } from "motion/react";
import loginBg from "../../../assets/ltz-login-bg.png";
import { LanguageSelector } from "./LanguageSelector";
import { OnlineStatusBadge } from "./OnlineStatusBadge";

interface AuthBackdropProps {
    children: ReactNode;
    direction?: number;
}

export function AuthBackdrop({
    children,
    direction = 1,
}: AuthBackdropProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-ltz-bg">
            {/* Arka plan görseli — karakteri korumak için sola hizalı, cover */}
            <motion.div
                className="auth-backdrop-image absolute inset-0 bg-cover bg-left bg-no-repeat"
                style={{ backgroundImage: `url(${loginBg})` }}
                initial={
                    shouldReduceMotion
                        ? false
                        : { opacity: 0.45, scale: 1.018 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
            />

            {/* Okunabilirlik overlay'leri (arka planı/karakteri öldürmeyecek şiddette) */}
            <div
                className="absolute inset-0 bg-gradient-to-r from-ltz-bg/45 via-ltz-bg/10 to-ltz-bg/50"
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-ltz-bg/5" aria-hidden="true" />
            <motion.div
                className="auth-atmosphere absolute inset-0"
                animate={
                    shouldReduceMotion
                        ? undefined
                        : { x: direction * 18, opacity: 0.4 }
                }
                transition={{
                    x: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.7, ease: "easeOut" },
                }}
                aria-hidden="true"
            />
            <motion.div
                className="auth-city-lights absolute inset-0"
                animate={shouldReduceMotion ? undefined : { x: direction * -10 }}
                transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
            />
            <div className="auth-particles absolute inset-0" aria-hidden="true" />
            <div className="auth-neon-flicker absolute inset-0" aria-hidden="true" />
            <div className="auth-scanlines absolute inset-0" aria-hidden="true" />
            <div className="auth-rim-light absolute inset-0" aria-hidden="true" />

            {/* Sağ üst: dil seçici */}
            <motion.div
                className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
                initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
            >
                <LanguageSelector />
            </motion.div>

            {/* Sol alt: online oyuncu rozeti */}
            <motion.div
                className="absolute bottom-4 left-4 z-20 sm:bottom-6 sm:left-6"
                initial={shouldReduceMotion ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
            >
                <OnlineStatusBadge />
            </motion.div>

            {/* Sayfaya özel içerik */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
