import type { GamingHistoryEvent } from "../../types/history.types";

interface HistoryTimelineProps {
    events: GamingHistoryEvent[];
}

function monthName(month: number): string {
    const date = new Date(2000, month - 1, 1);
    return new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(date);
}

export function HistoryTimeline({ events }: HistoryTimelineProps) {
    if (events.length === 0) {
        return null;
    }

    const sorted = [...events].sort((a, b) => {
        if (a.eventYear !== b.eventYear) return a.eventYear - b.eventYear;
        if (a.eventMonth !== b.eventMonth) return a.eventMonth - b.eventMonth;
        return a.eventDay - b.eventDay;
    });

    return (
        <div className="relative space-y-6 pl-8">
            <span
                aria-hidden="true"
                className="absolute bottom-0 left-3 top-0 w-px bg-gradient-to-b from-violet-500/70 via-fuchsia-500/40 to-transparent"
            />

            {sorted.map((event) => (
                <article key={event.id} className="relative">
                    <span className="absolute -left-[1.35rem] top-2 h-3 w-3 rounded-full border border-fuchsia-300 bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.8)]" />

                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                            {event.eventDay} {monthName(event.eventMonth)}{" "}
                            {event.eventYear}
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-white">
                            {event.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                            {event.description}
                        </p>

                        {event.imageUrl ? (
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="mt-4 max-h-56 w-full rounded-xl object-cover"
                            />
                        ) : null}
                    </div>
                </article>
            ))}
        </div>
    );
}
