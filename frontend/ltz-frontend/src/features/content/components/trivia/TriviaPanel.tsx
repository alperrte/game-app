import { useState } from "react";

import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { cn } from "../../../../utils/cn";
import { contentService } from "../../services/contentService";
import type { TodayTriviaResponse } from "../../types/trivia.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

interface TriviaPanelProps {
    initialData: TodayTriviaResponse;
    onUpdated: (data: TodayTriviaResponse) => void;
}

export function TriviaPanel({ initialData, onUpdated }: TriviaPanelProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const locked = initialData.hasAnswered;

    async function handleSubmit() {
        if (locked || selectedIndex === null || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            const result = await contentService.submitTriviaAnswer(selectedIndex);

            onUpdated({
                ...initialData,
                hasAnswered: true,
                wasCorrect: result.correct,
                correctOptionIndex: result.correctOptionIndex,
            });
        } catch (submitError) {
            setError(
                getErrorMessage(
                    submitError,
                    "Cevap gönderilirken bir hata oluştu.",
                ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card className="border-white/10 bg-slate-950/55 p-6 sm:p-8">
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
                    Günlük Trivia
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                    {initialData.question}
                </h2>
            </div>

            <div className="grid gap-3">
                {initialData.options.map((option, index) => {
                    const isSelected = selectedIndex === index;
                    const isCorrect =
                        locked &&
                        initialData.correctOptionIndex === index;
                    const isWrong =
                        locked &&
                        !initialData.wasCorrect &&
                        isSelected &&
                        !isCorrect;

                    return (
                        <button
                            key={option}
                            type="button"
                            disabled={locked}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition",
                                isCorrect
                                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                                    : isWrong
                                      ? "border-red-400/30 bg-red-500/10 text-red-100"
                                      : isSelected
                                        ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100"
                                        : "border-white/10 bg-black/20 text-slate-200 hover:border-violet-400/30",
                            )}
                        >
                            <span className="mr-2 text-violet-300">
                                {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                        </button>
                    );
                })}
            </div>

            {locked ? (
                <p
                    className={cn(
                        "mt-6 text-sm font-semibold",
                        initialData.wasCorrect
                            ? "text-violet-200"
                            : "text-fuchsia-200",
                    )}
                >
                    {initialData.wasCorrect
                        ? "Doğru cevap! Yarın yeni soruyla görüşürüz."
                        : "Bu sefer olmadı. Yarın tekrar dene."}
                </p>
            ) : (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                        type="button"
                        disabled={selectedIndex === null}
                        isLoading={submitting}
                        onClick={() => void handleSubmit()}
                    >
                        Cevabı gönder
                    </Button>
                    {error ? (
                        <p className="text-sm text-red-300">{error}</p>
                    ) : null}
                </div>
            )}
        </Card>
    );
}
