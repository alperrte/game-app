import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

import { CONTENT_ROUTES } from "../../../../lib/constants";
import type { TodayTriviaResponse } from "../../types/trivia.types";
import { HubWidgetCard } from "./HubWidgetCard";

interface HubTriviaTeaserProps {
    trivia: TodayTriviaResponse;
}

export function HubTriviaTeaser({ trivia }: HubTriviaTeaserProps) {
    return (
        <HubWidgetCard
            title="Günün Trivia Sorusu"
            subtitle="Her gün yeni soru"
            icon={Brain}
            action={{ label: "Cevapla", href: CONTENT_ROUTES.trivia }}
            contentClassName="space-y-4"
        >
            <p className="text-sm font-semibold leading-relaxed text-white">
                {trivia.question}
            </p>

            <div className="flex flex-wrap gap-2">
                {trivia.options.slice(0, 4).map((option, index) => (
                    <span
                        key={option}
                        className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300"
                    >
                        {String.fromCharCode(65 + index)}. {option}
                    </span>
                ))}
            </div>

            {trivia.hasAnswered ? (
                <p className="text-xs text-slate-400">
                    {trivia.wasCorrect
                        ? "Bugün doğru cevapladın."
                        : "Bugün cevapladın — yarın yeni soru."}
                </p>
            ) : (
                <Link
                    to={CONTENT_ROUTES.trivia}
                    className="inline-flex text-xs font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
                >
                    Cevabını gönder →
                </Link>
            )}
        </HubWidgetCard>
    );
}
