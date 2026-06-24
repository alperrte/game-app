/*
 * "Performans Beklentisi" bölümü.
 * Oyunları responsive bir grid içinde PerformanceGameCard olarak listeler.
 */

import { Card } from "../../../components/ui/Card";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import { PerformanceGameCard } from "./PerformanceGameCard";
import type { PerformanceExpectation } from "../types/hardware.types";

interface PerformanceExpectationSectionProps {
    games: PerformanceExpectation[];
}

export function PerformanceExpectationSection({
    games,
}: PerformanceExpectationSectionProps) {
    return (
        <Card className="p-6">
            <HardwarePanelHeader title="Performans Beklentisi" />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {games.map((game) => (
                    <PerformanceGameCard key={game.id} game={game} />
                ))}
            </div>
        </Card>
    );
}
