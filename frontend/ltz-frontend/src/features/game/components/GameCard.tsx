import { memo, useCallback, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent, SVGProps } from "react";
import { useNavigate } from "react-router-dom";

import { GAME_ROUTES } from "../../../lib/constants";
import type { Game } from "../types/gameTypes";
import type { ExternalGameSearchResponse } from "../types/externalGame.types";
import { getExternalGameImageUrl } from "../utils/steamImage";

export type GameCardViewMode = "grid" | "list";
export type GameCardOrigin = "external" | "manual";

type GameCardData = ExternalGameSearchResponse | Game;

type GameCardProps = {
    favorite?: boolean;
    game: GameCardData;
    onToggleFavorite?: (externalId: string) => void;
    origin: GameCardOrigin;
    viewMode: GameCardViewMode;
};

const MAX_CATEGORY_CHIPS = 3;

const cardOptimizationStyle: CSSProperties = {
    contentVisibility: "auto",
    containIntrinsicSize: "320px",
};

const SteamLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        aria-hidden="true"
        fill="currentColor"
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
    </svg>
);

const isExternalGame = (
    game: GameCardData
): game is ExternalGameSearchResponse => {
    return "externalId" in game;
};

const getCategoryChips = (game: GameCardData): string[] => {
    if (isExternalGame(game)) {
        return [];
    }

    const rawValues = [
        game.categoryName,
        ...(game.genre ? game.genre.split(",") : []),
    ];

    const seen = new Set<string>();
    const chips: string[] = [];

    for (const value of rawValues) {
        const trimmed = value?.trim();

        if (!trimmed) {
            continue;
        }

        const key = trimmed.toLocaleLowerCase("tr");

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        chips.push(trimmed);

        if (chips.length >= MAX_CATEGORY_CHIPS) {
            break;
        }
    }

    return chips;
};

const getShortDescription = (game: GameCardData): string | null => {
    if (isExternalGame(game)) {
        return null;
    }

    return game.description?.trim() || null;
};

const getDeveloperLabel = (game: GameCardData): string | null => {
    if (isExternalGame(game)) {
        return null;
    }

    return game.developer?.trim() || null;
};

const getDetailPath = (game: GameCardData) => {
    if (isExternalGame(game)) {
        return GAME_ROUTES.externalGameDetail(game.source, game.externalId);
    }

    return GAME_ROUTES.gameDetail(game.id);
};

const GameCard = ({
                      favorite = false,
                      game,
                      onToggleFavorite,
                      viewMode,
                  }: GameCardProps) => {
    const navigate = useNavigate();
    const [imageFailed, setImageFailed] = useState(false);

    const isList = viewMode === "list";
    const isSteam = game.source === "STEAM";

    const externalGame = useMemo(
        () => (isExternalGame(game) ? game : null),
        [game]
    );

    const detailPath = useMemo(() => getDetailPath(game), [game]);
    const categoryChips = useMemo(() => getCategoryChips(game), [game]);
    const shortDescription = useMemo(() => getShortDescription(game), [game]);
    const developerLabel = useMemo(() => getDeveloperLabel(game), [game]);

    const imageUrl = useMemo(() => {
        if (imageFailed) {
            return null;
        }

        if (externalGame) {
            return getExternalGameImageUrl({
                coverImageUrl: externalGame.coverImageUrl,
                externalId: externalGame.externalId,
                source: externalGame.source,
            });
        }

        return game.coverImageUrl?.trim() || null;
    }, [externalGame, game, imageFailed]);

    const openDetail = useCallback(() => {
        if (detailPath) {
            navigate(detailPath);
        }
    }, [detailPath, navigate]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            if (detailPath && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                openDetail();
            }
        },
        [detailPath, openDetail]
    );

    const handleImageError = useCallback(() => {
        setImageFailed(true);
    }, []);

    const handleFavoriteClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();

            if (externalGame && onToggleFavorite) {
                onToggleFavorite(externalGame.externalId);
            }
        },
        [externalGame, onToggleFavorite]
    );

    const handleDetailLinkClick = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            event.stopPropagation();
            openDetail();
        },
        [openDetail]
    );

    return (
        <article
            className={`group flex h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg transition-colors hover:border-violet-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
                detailPath ? "cursor-pointer" : ""
            } ${isList ? "md:grid md:grid-cols-[320px_1fr]" : "flex-col"}`}
            onClick={detailPath ? openDetail : undefined}
            onKeyDown={handleKeyDown}
            role={detailPath ? "button" : undefined}
            style={cardOptimizationStyle}
            tabIndex={detailPath ? 0 : undefined}
        >
            <div
                className={`relative aspect-[460/215] w-full overflow-hidden bg-slate-950 ${
                    isList ? "md:aspect-auto md:min-h-56" : ""
                }`}
            >
                {imageUrl ? (
                    <img
                        alt={game.title}
                        className="h-full w-full object-contain"
                        decoding="async"
                        loading="lazy"
                        onError={handleImageError}
                        src={imageUrl}
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 text-slate-400">
                        <span className="text-2xl font-black tracking-widest text-violet-300/80">
                            LTZ
                        </span>
                        <span className="text-xs text-slate-500">
                            Kapak görseli yok
                        </span>
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/10" />

                {isSteam ? (
                    <span
                        aria-label="Steam"
                        className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-[#1b2838]/90 ring-1 ring-white/10"
                        title="Steam"
                    >
                        <SteamLogo className="h-4 w-4 text-white" />
                    </span>
                ) : null}

                {externalGame && onToggleFavorite ? (
                    <button
                        aria-label="Favori durumunu değiştir"
                        className="absolute right-3 top-3 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-white/15 bg-black/50 text-lg text-white transition-colors hover:border-violet-300"
                        onClick={handleFavoriteClick}
                        type="button"
                    >
                        {favorite ? "♥" : "♡"}
                    </button>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h2 className="line-clamp-2 min-h-[56px] text-lg font-bold leading-7 text-white">
                    {game.title}
                </h2>

                {categoryChips.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {categoryChips.map((chip) => (
                            <span
                                className="rounded-full border border-violet-300/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-100"
                                key={chip}
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                ) : null}

                {shortDescription ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {shortDescription}
                    </p>
                ) : null}

                {developerLabel ? (
                    <p className="mt-2 text-xs font-medium text-slate-500">
                        {developerLabel}
                    </p>
                ) : null}

                <div className="mt-auto pt-4">
                    <a
                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-cyan-300/50"
                        href={detailPath}
                        onClick={handleDetailLinkClick}
                    >
                        Detayları Gör
                    </a>
                </div>
            </div>
        </article>
    );
};

export default memo(GameCard);
