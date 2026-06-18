import { useState, type FormEvent } from "react";

import type { ReviewFormValues } from "../types/review.types";

type ReviewFormProps = {
    submitting?: boolean;
    errorMessage?: string | null;
    onSubmit: (values: ReviewFormValues) => Promise<void>;
};

const initialValues: ReviewFormValues = {
    rating: 8,
    reviewText: "",
    recommended: true,
    playtimeHours: "",
    platform: "",
    hardwareInfo: "",
};

export function ReviewForm({
                               submitting = false,
                               errorMessage,
                               onSubmit,
                           }: ReviewFormProps) {
    const [values, setValues] = useState<ReviewFormValues>(initialValues);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!values.reviewText.trim()) {
            return;
        }

        await onSubmit(values);

        setValues(initialValues);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    İnceleme yaz
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Oyunu puanla, deneyimini paylaş ve diğer oyunculara fikir ver.
                </p>
            </div>

            {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {errorMessage}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Puan
          </span>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={values.rating}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                rating: Number(event.target.value),
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </label>

                <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Tavsiye
          </span>
                    <select
                        value={values.recommended ? "true" : "false"}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                recommended: event.target.value === "true",
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="true">Tavsiye ediyorum</option>
                        <option value="false">Tavsiye etmiyorum</option>
                    </select>
                </label>

                <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Oynama süresi
          </span>
                    <input
                        type="number"
                        min={0}
                        placeholder="Örn: 42"
                        value={values.playtimeHours}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                playtimeHours: event.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </label>

                <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Platform
          </span>
                    <input
                        type="text"
                        placeholder="PC, PlayStation, Xbox..."
                        value={values.platform}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                platform: event.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </label>
            </div>

            <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Donanım bilgisi
        </span>
                <input
                    type="text"
                    placeholder="Örn: RTX 4060, Ryzen 5, 16GB RAM"
                    value={values.hardwareInfo}
                    onChange={(event) =>
                        setValues((current) => ({
                            ...current,
                            hardwareInfo: event.target.value,
                        }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
            </label>

            <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          İnceleme metni
        </span>
                <textarea
                    rows={5}
                    placeholder="Bu oyun hakkında ne düşünüyorsun?"
                    value={values.reviewText}
                    onChange={(event) =>
                        setValues((current) => ({
                            ...current,
                            reviewText: event.target.value,
                        }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
            </label>

            <div className="mt-5 flex justify-end">
                <button
                    type="submit"
                    disabled={submitting || !values.reviewText.trim()}
                    className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Gönderiliyor..." : "İncelemeyi gönder"}
                </button>
            </div>
        </form>
    );
}