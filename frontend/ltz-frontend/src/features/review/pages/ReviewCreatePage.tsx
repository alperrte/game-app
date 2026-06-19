import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { GAME_ROUTES } from "../../../lib/constants";
import { getGamesByFilter } from "../../game/services/gameService";
import {
    getExternalAppsPage,
    searchExternalGames,
} from "../../game/services/externalGameService";
import type { Game } from "../../game/types/gameTypes";
import type {
    ExternalGameSearchResponse,
    GameSource,
} from "../../game/types/externalGame.types";
import { reviewService } from "../services/reviewService";
import type {
    CreateReviewRequest,
    ReviewFormValues,
} from "../types/review.types";
import { ReviewForm } from "../components/ReviewForm";

const EXTERNAL_PAGE = 1;
const EXTERNAL_PER_PAGE = 100;
const SEARCH_DEBOUNCE_MS = 450;

type ApiErrorLike = {
    status?: number;
    response?: {
        status?: number;
    };
    message?: string;
};

type ReviewGameOption =
    | {
    origin: "manual";
    id: string;
    source: GameSource;
    title: string;
    genre: string | null;
    platform: string | null;
    game: Game;
}
    | {
    origin: "external";
    id: string;
    source: GameSource;
    title: string;
    genre: string | null;
    platform: string | null;
    game: ExternalGameSearchResponse;
};

function getErrorStatus(error: unknown) {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }

    const apiError = error as ApiErrorLike;

    return apiError.status ?? apiError.response?.status;
}

function toNullableText(value: string) {
    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function toNullableNumber(value: string) {
    if (!value.trim()) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isNaN(parsedValue) ? null : parsedValue;
}

function getSourceLabel(source: GameSource) {
    return source === "STEAM" ? "Steam" : "Epic Games";
}

function toSearchableText(value: string | null | undefined) {
    return value?.toLocaleLowerCase("tr-TR") ?? "";
}

function isManualGameMatchedByQuery(game: Game, query: string) {
    const trimmedQuery = query.trim().toLocaleLowerCase("tr-TR");

    if (!trimmedQuery) {
        return true;
    }

    const searchableText = [
        game.title,
        game.description,
        game.genre,
        game.platform,
        game.developer,
        game.publisher,
        game.categoryName,
    ]
        .map(toSearchableText)
        .join(" ");

    return searchableText.includes(trimmedQuery);
}

function toManualReviewOption(game: Game): ReviewGameOption {
    return {
        origin: "manual",
        id: `${game.source}-manual-${game.id}`,
        source: game.source,
        title: game.title,
        genre: game.genre,
        platform: game.platform,
        game,
    };
}

function toExternalReviewOption(game: ExternalGameSearchResponse): ReviewGameOption {
    return {
        origin: "external",
        id: `${game.source}-external-${game.externalId}`,
        source: game.source,
        title: game.title,
        genre: null,
        platform: getSourceLabel(game.source),
        game,
    };
}

export default function ReviewCreatePage() {
    const [source, setSource] = useState<GameSource>("STEAM");

    /*
     * query inputun gerçek anlık değeridir.
     * debouncedQuery ise kullanıcı yazmayı bıraktıktan sonra arama için kullanılır.
     */
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [gameOptions, setGameOptions] = useState<ReviewGameOption[]>([]);
    const [selectedOptionId, setSelectedOptionId] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const searchTimeoutRef = useRef<number | null>(null);
    const requestIdRef = useRef(0);

    const selectedGameOption = useMemo(
        () =>
            gameOptions.find((gameOption) => gameOption.id === selectedOptionId) ??
            null,
        [gameOptions, selectedOptionId],
    );

    useEffect(() => {
        if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            if (searchTimeoutRef.current) {
                window.clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query]);

    useEffect(() => {
        let active = true;

        const loadGames = async () => {
            const requestId = requestIdRef.current + 1;
            requestIdRef.current = requestId;

            setLoading(true);
            setPageErrorMessage(null);

            try {
                const trimmedQuery = debouncedQuery.trim();

                const manualGamesPromise = getGamesByFilter({ source });

                const externalGamesPromise = trimmedQuery
                    ? searchExternalGames(source, trimmedQuery)
                    : getExternalAppsPage(
                        source,
                        EXTERNAL_PAGE,
                        EXTERNAL_PER_PAGE,
                    ).then((page) => page.items);

                const [manualGames, externalGames] = await Promise.all([
                    manualGamesPromise,
                    externalGamesPromise,
                ]);

                if (!active || requestIdRef.current !== requestId) {
                    return;
                }

                const manualOptions = manualGames
                    .filter((game) => isManualGameMatchedByQuery(game, debouncedQuery))
                    .map(toManualReviewOption);

                const externalOptions = externalGames.map(toExternalReviewOption);

                const nextOptions = [...manualOptions, ...externalOptions];

                setGameOptions(nextOptions);

                if (nextOptions.length > 0) {
                    setSelectedOptionId(nextOptions[0].id);
                } else {
                    setSelectedOptionId("");
                }
            } catch {
                if (!active || requestIdRef.current !== requestId) {
                    return;
                }

                setGameOptions([]);
                setSelectedOptionId("");
                setPageErrorMessage("Oyunlar yüklenirken bir sorun oluştu.");
            } finally {
                if (active && requestIdRef.current === requestId) {
                    setLoading(false);
                }
            }
        };

        void loadGames();

        return () => {
            active = false;
        };
    }, [debouncedQuery, source]);

    const handleSourceChange = (nextSource: GameSource) => {
        setSource(nextSource);
        setQuery("");
        setDebouncedQuery("");
        setFormErrorMessage(null);
        setSuccessMessage(null);
    };

    const handleCreateReview = async (values: ReviewFormValues) => {
        setSubmitting(true);
        setFormErrorMessage(null);
        setSuccessMessage(null);

        if (!selectedGameOption) {
            setFormErrorMessage("İnceleme yazmak için önce bir oyun seçmelisin.");
            setSubmitting(false);
            return;
        }

        const request: CreateReviewRequest =
            selectedGameOption.origin === "manual"
                ? {
                    gameSource: selectedGameOption.source,
                    gameId: selectedGameOption.game.id,
                    externalGameId: null,
                    rating: values.rating,
                    reviewText: values.reviewText.trim(),
                    recommended: values.recommended,
                    playtimeHours: toNullableNumber(values.playtimeHours),
                    playtimeMinutes: toNullableNumber(values.playtimeMinutes),
                    platform: toNullableText(values.platform),
                    hardwareInfo: toNullableText(values.hardwareInfo),
                }
                : {
                    gameSource: selectedGameOption.source,
                    gameId: null,
                    externalGameId: selectedGameOption.game.externalId,
                    rating: values.rating,
                    reviewText: values.reviewText.trim(),
                    recommended: values.recommended,
                    playtimeHours: toNullableNumber(values.playtimeHours),
                    playtimeMinutes: toNullableNumber(values.playtimeMinutes),
                    platform: toNullableText(values.platform),
                    hardwareInfo: toNullableText(values.hardwareInfo),
                };

        try {
            await reviewService.createReview(request);

            setSuccessMessage(
                `"${selectedGameOption.title}" için incelemen başarıyla oluşturuldu.`,
            );
        } catch (error) {
            const status = getErrorStatus(error);

            if (status === 409) {
                setFormErrorMessage("Bu oyun için zaten inceleme oluşturdun.");
                return;
            }

            if (status === 401 || status === 403) {
                setFormErrorMessage("İnceleme yazmak için giriş yapmalısın.");
                return;
            }

            setFormErrorMessage("İnceleme gönderilirken bir sorun oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-300">
                    İncelemeler
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                    İnceleme Yaz
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    İnceleme yapmak istediğin oyunu seç, puanını ver ve deneyimini
                    diğer oyuncularla paylaş. Yazdığın inceleme seçtiğin oyunun
                    detay sayfasında görünmeye devam eder.
                </p>
            </div>

            {pageErrorMessage && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {pageErrorMessage}
                </div>
            )}

            {successMessage && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {successMessage}
                </div>
            )}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Kaynak
                        </span>

                        <select
                            value={source}
                            onChange={(event) =>
                                handleSourceChange(event.target.value as GameSource)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="STEAM">Steam</option>
                            <option value="EPIC">Epic Games</option>
                        </select>
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Oyun ara
                        </span>

                        <input
                            type="search"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setFormErrorMessage(null);
                                setSuccessMessage(null);
                            }}
                            placeholder="Örn. elden ring"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                        />

                        {loading ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Arama sonuçları güncelleniyor...
                            </p>
                        ) : null}
                    </label>
                </div>

                <label className="mt-4 block space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        İnceleme yapılacak oyun
                    </span>

                    <select
                        value={selectedOptionId}
                        disabled={gameOptions.length === 0}
                        onChange={(event) => {
                            setSelectedOptionId(event.target.value);
                            setFormErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        {gameOptions.length > 0 ? (
                            gameOptions.map((gameOption) => (
                                <option key={gameOption.id} value={gameOption.id}>
                                    {gameOption.title} ·{" "}
                                    {gameOption.origin === "manual"
                                        ? "Kayıtlı oyun"
                                        : getSourceLabel(gameOption.source)}
                                </option>
                            ))
                        ) : loading ? (
                            <option>Oyunlar yükleniyor...</option>
                        ) : (
                            <option>İnceleme yapılacak oyun bulunamadı</option>
                        )}
                    </select>
                </label>

                {selectedGameOption && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-950 dark:text-white">
                                    {selectedGameOption.title}
                                </h2>

                                <p className="mt-1 text-slate-500 dark:text-slate-400">
                                    {selectedGameOption.genre || "Tür belirtilmedi"} ·{" "}
                                    {selectedGameOption.platform ||
                                        getSourceLabel(selectedGameOption.source)}
                                </p>
                            </div>

                            {selectedGameOption.origin === "manual" ? (
                                <Link
                                    to={GAME_ROUTES.gameDetail(
                                        selectedGameOption.game.id,
                                    )}
                                    className="text-sm font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                                >
                                    Oyunun sayfasına git
                                </Link>
                            ) : (
                                <Link
                                    to={GAME_ROUTES.externalGameDetail(
                                        selectedGameOption.source,
                                        selectedGameOption.game.externalId,
                                    )}
                                    className="text-sm font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
                                >
                                    Oyunun sayfasına git
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {selectedGameOption ? (
                <ReviewForm
                    submitting={submitting}
                    errorMessage={formErrorMessage}
                    onSubmit={handleCreateReview}
                />
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                        Oyun seçilemedi
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        İnceleme yazmak için önce listeden bir oyun seçmelisin.
                    </p>
                </div>
            )}
        </main>
    );
}