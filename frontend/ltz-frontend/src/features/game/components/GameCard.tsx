import { useState } from "react";
import type { KeyboardEvent } from "react";
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

const isExternalGame = (
  game: GameCardData
): game is ExternalGameSearchResponse => {
  return "externalId" in game;
};

const getSubtitle = (game: GameCardData) => {
  if (isExternalGame(game)) {
    return `External ID: ${game.externalId}`;
  }

  return [game.categoryName, game.genre, game.platform]
    .filter(Boolean)
    .join(" • ");
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
  const externalGame = isExternalGame(game) ? game : null;
  const detailPath = externalGame
    ? GAME_ROUTES.externalGameDetail(externalGame.source, externalGame.externalId)
    : null;
  const imageUrl = imageFailed
    ? null
    : externalGame
      ? getExternalGameImageUrl({
          coverImageUrl: externalGame.coverImageUrl,
          externalId: externalGame.externalId,
          source: externalGame.source,
        })
      : game.coverImageUrl?.trim() || null;
  const originLabel = origin === "external" ? "Harici" : "Manuel";
  const subtitle = getSubtitle(game);

  const openDetail = () => {
    if (detailPath) {
      navigate(detailPath);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (detailPath && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
        detailPath ? "cursor-pointer" : ""
      } ${isList ? "grid md:grid-cols-[320px_1fr]" : ""}`}
      onClick={detailPath ? openDetail : undefined}
      onKeyDown={handleKeyDown}
      role={detailPath ? "button" : undefined}
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
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
            onError={() => setImageFailed(true)}
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 text-sm text-slate-400">
            Kapak görseli yok
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />

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
            className="absolute right-3 top-3 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-white/15 bg-black/40 text-lg text-white backdrop-blur transition hover:border-violet-300"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(externalGame.externalId);
            }}
            type="button"
          >
            {favorite ? "♥" : "♡"}
          </button>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h2 className="line-clamp-2 text-lg font-bold text-white">
            {game.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>{game.source}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>{subtitle || "Manuel kayıt"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {detailPath ? (
            <a
              className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/50"
              href={detailPath}
              onClick={(event) => event.stopPropagation()}
            >
              Detayları Gör
            </a>
          ) : (
            <button
              className="inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-400"
              disabled
              type="button"
            >
              Manuel kayıt
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default GameCard;
