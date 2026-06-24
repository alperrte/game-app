/*
 * "Popüler İncelemeler" kartı.
 * Donanım ürünlerini puanlarıyla (yıldız rozeti) listeler.
 */

import { Star } from "lucide-react";

import { Card } from "../../../components/ui/Card";
import { HardwarePanelHeader } from "./HardwarePanelHeader";
import type { HardwareReview } from "../types/hardware.types";

interface HardwareReviewsCardProps {
    reviews: HardwareReview[];
    onViewAll?: () => void;
}

export function HardwareReviewsCard({
    reviews,
    onViewAll,
}: HardwareReviewsCardProps) {
    return (
        <Card className="p-5">
            <HardwarePanelHeader
                title="Popüler İncelemeler"
                actionLabel="Tümünü Gör"
                onAction={onViewAll}
            />

            <div className="mt-4 flex flex-col gap-2">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-violet-400/15 bg-white/[0.02] px-4 py-3"
                    >
                        <span className="truncate text-sm font-semibold text-white">
                            {review.productName}
                        </span>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            <Star size={13} className="fill-amber-300" />
                            {review.rating.toFixed(1)}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
