/*
 * Dairesel sistem skoru göstergesi (SVG donut).
 *
 * - Skor, açılışta 0'dan hedef değere kadar count-up animasyonu ile dolar.
 * - Yay rengi skora göre anlam kazanır: düşük → amber/rose, yüksek → cyan.
 * - prefers-reduced-motion açıksa animasyon atlanır.
 */

import { useEffect, useState } from "react";

interface SystemScoreGaugeProps {
    score: number;
    max: number;
    size?: number;
}

/*
 * Skora karşılık gelen neon gradient renk çiftini döner.
 */
function resolveScoreColors(ratio: number): { from: string; to: string } {
    if (ratio < 0.5) {
        return { from: "#f43f5e", to: "#fb7185" }; // rose
    }
    if (ratio < 0.75) {
        return { from: "#f59e0b", to: "#fbbf24" }; // amber
    }
    if (ratio < 0.9) {
        return { from: "#7c3aed", to: "#d946ef" }; // violet → fuchsia
    }
    return { from: "#22d3ee", to: "#a855f7" }; // cyan → purple (elite)
}

export function SystemScoreGauge({
    score,
    max,
    size = 132,
}: SystemScoreGaugeProps) {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = max > 0 ? Math.min(Math.max(score / max, 0), 1) : 0;
    const colors = resolveScoreColors(ratio);

    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        let frame = 0;

        if (reduceMotion) {
            /* rAF içinde set ederek effect içinde senkron setState'ten kaçınılır */
            frame = requestAnimationFrame(() => setAnimatedScore(score));
            return () => cancelAnimationFrame(frame);
        }

        const duration = 900;
        let startTime: number | null = null;

        function tick(now: number) {
            if (startTime === null) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            /* easeOutCubic */
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        }

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [score]);

    const animatedRatio = max > 0 ? Math.min(animatedScore / max, 1) : 0;
    const dashOffset = circumference * (1 - animatedRatio);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <defs>
                    <linearGradient
                        id="ltz-score-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={colors.from} />
                        <stop offset="100%" stopColor={colors.to} />
                    </linearGradient>
                </defs>

                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(124,58,237,0.15)"
                    strokeWidth={strokeWidth}
                />

                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#ltz-score-gradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{
                        filter: `drop-shadow(0 0 6px ${colors.to})`,
                    }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tabular-nums text-white">
                    {animatedScore}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                    /{max}
                </span>
            </div>
        </div>
    );
}
