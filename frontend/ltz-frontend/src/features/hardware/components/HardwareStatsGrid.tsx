/*
 * Hero altındaki 4'lü özet istatistik kart ızgarası.
 */

import { HardwareStatCard } from "./HardwareStatCard";
import type { HardwareStat } from "../types/hardware.types";

interface HardwareStatsGridProps {
    stats: HardwareStat[];
}

export function HardwareStatsGrid({ stats }: HardwareStatsGridProps) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <HardwareStatCard key={stat.id} stat={stat} />
            ))}
        </section>
    );
}
