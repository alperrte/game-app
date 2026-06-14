/*
 * Auth (login / register) ortak layout'u.
 *
 * - AuthBackdrop (arka plan + HUD) KALICI render edilir; sayfa geçişinde
 *   yeniden mount edilmez (iki arka planın üst üste binmesi önlenir).
 * - İçerik (login/register paneli) motion + AnimatePresence ile değiştirilir.
 *   Geçiş yön-farkındalıklıdır: login -> register sağdan, register -> login soldan.
 */

import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";

import { AuthBackdrop } from "../features/auth/components/AuthBackdrop";
import { ROUTES } from "../lib/constants";

/*
 * dir = 1  -> ileri (sağdan girer, sola çıkar)   [login -> register]
 * dir = -1 -> geri  (soldan girer, sağa çıkar)   [register -> login]
 */
const pageVariants: Variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 48 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -32 }),
};

export function AuthLayout() {
    const location = useLocation();
    const outlet = useOutlet();

    /*
     * Yalnızca iki sayfa olduğu için yön doğrudan hedef sayfadan türetilir:
     * register'a gidiliyorsa ileri, login'e gidiliyorsa geri.
     */
    const direction = location.pathname === ROUTES.register ? 1 : -1;

    return (
        <AuthBackdrop>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                    key={location.pathname}
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 380, damping: 34, mass: 0.9 },
                        opacity: { duration: 0.22, ease: "easeOut" },
                    }}
                    style={{ willChange: "transform, opacity" }}
                >
                    {outlet}
                </motion.div>
            </AnimatePresence>
        </AuthBackdrop>
    );
}
