import { useEffect, useState } from "react";

import { formatCurrency } from "../../../../utils/formatCurrency";
import { contentService } from "../../services/contentService";
import type { PriceSnapshot } from "../../types/deals.types";

interface PriceSparklineProps {
    gameTitle: string;
}

const WIDTH = 200;
const HEIGHT = 40;

export function PriceSparkline({ gameTitle }: PriceSparklineProps) {
    const [snapshots, setSnapshots] = useState<PriceSnapshot[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        contentService
            .getDealPriceHistory(gameTitle)
            .then((result) => {
                if (active) setSnapshots(result);
            })
            .catch(() => {
                if (active) setSnapshots([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [gameTitle]);

    if (loading) {
        return (
            <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
        );
    }

    if (!snapshots || snapshots.length < 2) {
        return (
            <p className="text-xs text-slate-500">
                Trend için yeterli veri birikmedi. Fiyat her tarama döngüsünde
                kaydediliyor.
            </p>
        );
    }

    const prices = snapshots.map((s) => s.discountedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = snapshots
        .map((snapshot, index) => {
            const x = (index / (snapshots.length - 1)) * WIDTH;
            const y =
                HEIGHT - ((snapshot.discountedPrice - min) / range) * (HEIGHT - 6) - 3;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return (
        <div>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                width="100%"
                height={HEIGHT}
                className="overflow-visible"
                role="img"
                aria-label="Fiyat trendi"
            >
                <polyline
                    points={points}
                    fill="none"
                    stroke="rgb(217 70 239)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                    En düşük: {formatCurrency(min, snapshots[0].currency)}
                </span>
                <span>
                    En yüksek: {formatCurrency(max, snapshots[0].currency)}
                </span>
            </div>
        </div>
    );
}
