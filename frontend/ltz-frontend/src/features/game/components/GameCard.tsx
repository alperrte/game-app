import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { GAME_ROUTES } from "../../../lib/constants";
import type { ExternalGameSearchResponse } from "../types/externalGame.types";
import { getExternalGameImageUrl } from "../utils/steamImage";

export type GameCardViewMode = "grid" | "list";

type GameCardProps = {
  favorite: boolean;
  game: ExternalGameSearchResponse;
  onToggleFavorite: (externalId: string) => void;
  viewMode: GameCardViewMode;
};

const GameCard = ({
  favorite,
  game,
  onToggleFavorite,
  viewMode,
}: GameCardProps) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const isList = viewMode === "list";
  const detailPath = GAME_ROUTES.externalGameDetail(
    game.source,
    game.externalId
  );
  const imageUrl = imageFailed
    ? null
    : getExternalGameImageUrl({
        coverImageUrl: game.coverImageUrl,
        externalId: game.externalId,
        source: game.source,
      });

  const openDetail = () => {
    navigate(detailPath);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      className={`group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
        isList ? "grid md:grid-cols-[320px_1fr]" : ""
      }`}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
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
        </div>

        <button
          aria-label="Favori durumunu değiştir"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-black/40 text-lg text-white backdrop-blur transition hover:border-violet-300"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(game.externalId);
          }}
          type="button"
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h2 className="line-clamp-2 text-lg font-bold text-white">
            {game.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>{game.source}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>External ID: {game.externalId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/50"
            href={detailPath}
            onClick={(event) => event.stopPropagation()}
          >
            Görüntüle
          </a>
        </div>
      </div>
    </article>
  );
};

export default GameCard;
