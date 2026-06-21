import { memo, useCallback, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
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

const cardOptimizationStyle: CSSProperties = {
    contentVisibility: "auto",
    containIntrinsicSize: "320px",
};

const isExternalGame = (
    game: GameCardData
): game is ExternalGameSearchResponse => {
    return "externalId" in game;
};

const getSubtitle = (game: GameCardData) => {
    if (isExternalGame(game)) {
        return "Harici oyun";
    }

    return [game.categoryName, game.genre, game.platform]
        .filter(Boolean)
        .join(" • ");
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
                      origin,
                      viewMode,
                  }: GameCardProps) => {
    const navigate = useNavigate();
    const [imageFailed, setImageFailed] = useState(false);

    const isList = viewMode === "list";

    const externalGame = useMemo(
        () => (isExternalGame(game) ? game : null),
        [game]
    );

    const detailPath = useMemo(() => getDetailPath(game), [game]);
    const subtitle = useMemo(() => getSubtitle(game), [game]);

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

    const originLabel = origin === "external" ? "Harici" : "Manuel";

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
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 text-sm text-slate-400">
                        Kapak görseli yok
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/10" />

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
            {game.source}
          </span>

                    <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            origin === "external"
                                ? "border-violet-300/30 bg-violet-500/15 text-violet-100"
                                : "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                        }`}
                    >
            {originLabel}
          </span>
                </div>

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
                <div>
                    <h2 className="line-clamp-2 min-h-[56px] text-lg font-bold leading-7 text-white">
                        {game.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span>{game.source}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                        <span>{subtitle || "Manuel kayıt"}</span>
                    </div>
                </div>

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