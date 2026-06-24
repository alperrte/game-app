/*
 * Küçük neon trend grafiği (SVG sparkline).
 * Değerleri 0..1 aralığına normalize edip yumuşak bir çizgi ve
 * altına hafif gradient dolgu çizer. Stat kartlarında kullanılır.
 */

import { useId } from "react";

interface SparklineProps {
    data: number[];
    stroke: string;
    width?: number;
    height?: number;
}

export function Sparkline({
    data,
    stroke,
    width = 120,
    height = 36,
}: SparklineProps) {
    const gradientId = useId();

    if (data.length < 2) {
        return null;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((value, index) => {
        const x = index * stepX;
        /* SVG'de y aşağı doğru arttığı için ters çeviriyoruz */
        const y = height - ((value - min) / span) * height;
        return { x, y };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ");

    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
            </defs>

            <path d={areaPath} fill={`url(#${gradientId})`} />

            <path
                d={linePath}
                fill="none"
                stroke={stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
            />
        </svg>
    );
}
