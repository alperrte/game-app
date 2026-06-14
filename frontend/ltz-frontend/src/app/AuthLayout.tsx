/*
 * Auth (login / register) ortak layout'u.
 *
 * Mimari: "ortak kabuk + form-only geçiş"
 * - AuthBackdrop (arka plan + HUD) ve sayfa iskeleti (feature kartları + kart kabuğu)
 *   KALICI render edilir; route değişiminde yeniden mount edilmez.
 * - Yalnızca kartın İÇİNDEKİ form (outlet) motion + AnimatePresence ile değişir.
 *   Böylece kart sabit kalır; sadece form yumuşak şekilde swap olur.
 * - Geçiş yön-farkındalıklıdır:
 *     login  -> register : login formu sola kaybolur, register sağdan gelir.
 *     register -> login  : ters yönde çalışır.
 */

import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

import { Card } from "../components/ui/Card";
import { AuthBackdrop } from "../features/auth/components/AuthBackdrop";
import { FeatureCards } from "../features/auth/components/FeatureCards";
import { ROUTES } from "../lib/constants";

/*
 * dir = 1  -> ileri (sağdan girer, sola çıkar)   [login -> register]
 * dir = -1 -> geri  (soldan girer, sağa çıkar)   [register -> login]
 */
const formVariants: Variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

export function AuthLayout() {
    const location = useLocation();
    const outlet = useOutlet();
    const shouldReduceMotion = useReducedMotion();

    /*
     * Yalnızca iki sayfa olduğu için yön doğrudan hedef sayfadan türetilir:
     * register'a gidiliyorsa ileri, login'e gidiliyorsa geri.
     */
    const direction = location.pathname === ROUTES.register ? 1 : -1;

    return (
        <AuthBackdrop direction={direction}>
            <div className="mx-auto grid min-h-screen max-w-[84rem] grid-cols-1 items-center gap-8 px-6 py-16 xl:grid-cols-[1fr_420px_minmax(0,550px)] xl:gap-10">
                {/* Sol kolon: karakterin görünür kalması için boş bırakılır */}
                <div className="hidden xl:block" aria-hidden="true" />

                {/* Orta kolon: feature kartları (login + register'da kalıcı) */}
                <div className="flex justify-center xl:justify-start">
                    <FeatureCards />
                </div>

                {/* Sağ kolon: sabit auth kartı — içindeki form animasyonla değişir */}
                <div className="mx-auto w-full max-w-[510px] xl:mx-0">
                    <motion.div
                        initial={
                            shouldReduceMotion
                                ? false
                                : { opacity: 0, y: 18, scale: 0.985 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            delay: 0.18,
                            duration: 0.62,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <Card className="login-panel flex min-h-[41rem] flex-col px-8 py-9 sm:px-12 sm:py-10">
                            <AnimatePresence
                                mode="wait"
                                custom={direction}
                                initial={false}
                            >
                                <motion.div
                                    key={location.pathname}
                                    custom={direction}
                                    variants={formVariants}
                                    initial={shouldReduceMotion ? false : "initial"}
                                    animate="animate"
                                    exit={shouldReduceMotion ? undefined : "exit"}
                                    transition={{
                                        x: {
                                            type: "spring",
                                            stiffness: 420,
                                            damping: 36,
                                            mass: 0.8,
                                        },
                                        opacity: {
                                            duration: 0.18,
                                            ease: "easeOut",
                                        },
                                    }}
                                    style={{ willChange: "transform, opacity" }}
                                    className="w-full"
                                >
                                    {outlet}
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </AuthBackdrop>
    );
}
