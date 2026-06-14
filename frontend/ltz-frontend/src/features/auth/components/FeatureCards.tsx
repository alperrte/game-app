/*
 * Login sayfasının orta-sol alanındaki 4 feature kartının listesi.
 * Yalnızca xl ve üstü ekranlarda görünür (mobilde gizlenir).
 */

import { Compass, Star, Users, UsersRound } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const FEATURES = [
    {
        icon: Users,
        title: "Arkadaş Bul",
        description: "Oyuncularla eşleş",
    },
    {
        icon: UsersRound,
        title: "Lobi Kur",
        description: "Takımını oluştur",
    },
    {
        icon: Star,
        title: "İncele",
        description: "Oyunları değerlendir",
    },
    {
        icon: Compass,
        title: "Keşfet",
        description: "Yeni içerikler keşfet",
    },
] as const;

export function FeatureCards() {
    return (
        <div className="hidden w-full max-w-sm flex-col gap-4 xl:flex">
            {FEATURES.map((feature) => (
                <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                />
            ))}
        </div>
    );
}
