/*
 * "Donanım Detayları" bölümü.
 * Bileşenleri 2 kolonlu grid içinde düzenlenebilir kartlar olarak gösterir.
 */

import { Card } from "../../../components/ui/Card";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import { HardwareDetailCard } from "./HardwareDetailCard";
import type { HardwareComponent } from "../types/hardware.types";

interface HardwareDetailsGridProps {
    components: HardwareComponent[];
    onEditComponent?: (component: HardwareComponent) => void;
}

export function HardwareDetailsGrid({
    components,
    onEditComponent,
}: HardwareDetailsGridProps) {
    return (
        <Card className="p-6">
            <HardwarePanelHeader title="Donanım Detayları" />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {components.map((component) => (
                    <HardwareDetailCard
                        key={component.id}
                        component={component}
                        onEdit={onEditComponent}
                    />
                ))}
            </div>
        </Card>
    );
}
