import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";

import type { ReviewFormValues } from "../types/review.types";

type ReviewFormProps = {
    submitting?: boolean;
    errorMessage?: string | null;
    onSubmit: (values: ReviewFormValues) => Promise<void>;
};

const ratingOptions = Array.from({ length: 10 }, (_, index) => index + 1);

const platformOptions = [
    "",
    "PC",
    "Steam Deck",
    "PlayStation 5",
    "PlayStation 4",
    "Xbox Series X/S",
    "Xbox One",
    "Nintendo Switch",
    "Mobile",
    "Mac",
    "Linux",
];

const initialValues: ReviewFormValues = {
    rating: 0,
    reviewText: "",
    recommended: true,
    playtimeHours: "",
    playtimeMinutes: "",
    platform: "",
    hardwareInfo: "",
};

export function ReviewForm({
                               submitting = false,
                               errorMessage,
                               onSubmit,
                           }: ReviewFormProps) {
    const [values, setValues] = useState<ReviewFormValues>(initialValues);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);

    const visibleRating = hoveredRating ?? values.rating;
    const hasSelectedRating = values.rating >= 1;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!values.reviewText.trim() || !hasSelectedRating) {
            return;
        }

        await onSubmit(values);

        setValues(initialValues);
        setHoveredRating(null);
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
                <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Puan
                    </span>

                    <div
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                        onMouseLeave={() => setHoveredRating(null)}
                    >
                        <div className="flex flex-wrap items-center gap-1.5">
                            {ratingOptions.map((rating) => {
                                const active = rating <= visibleRating;

                                return (
                                    <button
                                        key={rating}
                                        type="button"
                                        aria-label={`${rating} puan ver`}
                                        title={`${rating} / 10`}
                                        onMouseEnter={() => setHoveredRating(rating)}
                                        onFocus={() => setHoveredRating(rating)}
                                        onBlur={() => setHoveredRating(null)}
                                        onClick={() =>
                                            setValues((current) => ({
                                                ...current,
                                                rating,
                                            }))
                                        }
                                        className="
                                            group rounded-lg p-1
                                            transition
                                            hover:-translate-y-0.5
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-purple-500/40
                                        "
                                    >
                                        <Star
                                            size={26}
                                            strokeWidth={1.8}
                                            className={`
                                                transition
                                                ${
                                                active
                                                    ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.45)]"
                                                    : "fill-transparent text-slate-300 group-hover:text-yellow-300 dark:text-slate-600 dark:group-hover:text-yellow-300"
                                            }
                                            `}
                                        />
                                    </button>
                                );
                            })}

                            <span className="ml-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {hasSelectedRating
                                    ? `${values.rating} / 10`
                                    : "Puan seçilmedi"}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Yıldızların üzerine gelerek önizle, tıklayarak puanı seç.
                        </p>
                    </div>
                </div>

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
                        max={99999}
                        step={1}
                        inputMode="numeric"
                        placeholder="Örn: 120"
                        value={values.playtimeHours}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                playtimeHours: event.target.value,
                                playtimeMinutes: "",
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                    />

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Oynama süresini saat olarak yaz.
                    </p>
                </label>

                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Platform
                    </span>

                    <select
                        value={values.platform}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                platform: event.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">Platform seç</option>
                        {platformOptions
                            .filter((platform) => platform !== "")
                            .map((platform) => (
                                <option key={platform} value={platform}>
                                    {platform}
                                </option>
                            ))}
                    </select>
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
                    disabled={
                        submitting ||
                        !values.reviewText.trim() ||
                        !hasSelectedRating
                    }
                    className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Gönderiliyor..." : "İncelemeyi gönder"}
                </button>
            </div>
        </form>
    );
}