/*
 * Login sayfasının orta-sol alanındaki 4 feature kartının listesi.
 * Yalnızca xl ve üstü ekranlarda görünür (mobilde gizlenir).
 */

import { Award, Navigation, UserRoundPlus, UsersRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FeatureCard } from "./FeatureCard";
import { PlatformActivity } from "./PlatformActivity";

const FEATURES = [
    {
        icon: UserRoundPlus,
        title: "Arkadaş Bul",
        description: "Oyuncularla eşleş",
    },
    {
        icon: UsersRound,
        title: "Lobi Kur",
        description: "Takımını oluştur",
    },
    {
        icon: Award,
        title: "İncele",
        description: "Oyunları değerlendir",
    },
    {
        icon: Navigation,
        title: "Keşfet",
        description: "Yeni içerikler keşfet",
    },
] as const;

export function FeatureCards() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            className="hidden w-full max-w-sm flex-col gap-4 xl:flex"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        delayChildren: 0.28,
                        staggerChildren: shouldReduceMotion ? 0 : 0.1,
                    },
                },
            }}
        >
            {FEATURES.map((feature) => (
                <motion.div
                    key={feature.title}
                    variants={{
                        hidden: shouldReduceMotion
                            ? { opacity: 1 }
                            : { opacity: 0, x: -22 },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                duration: 0.48,
                                ease: [0.22, 1, 0.36, 1],
                            },
                        },
                    }}
                >
                    <FeatureCard
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                    />
                </motion.div>
            ))}

            <motion.div
                variants={{
                    hidden: shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 12 },
                    visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                        },
                    },
                }}
            >
                <PlatformActivity />
            </motion.div>
        </motion.div>
    );
}
