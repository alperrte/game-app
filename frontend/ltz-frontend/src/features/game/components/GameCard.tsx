import { GAME_ROUTES } from "../../../lib/constants";
import type { Game } from "../types/gameTypes";
import type { GameViewMode } from "./GameFilterForm";

type GameCardProps = {
  favorite: boolean;
  game: Game;
  onToggleFavorite: (id: number) => void;
  viewMode: GameViewMode;
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "Yayın tarihi yok";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const getBadges = (game: Game) => {
  return [
    game.earlyAccess ? { label: "Erken Erişim", className: "from-indigo-500 to-violet-600" } : null,
    game.onSale ? { label: "İndirimde", className: "from-emerald-500 to-green-600" } : null,
    game.turkishLanguageSupport
      ? { label: "Türkçe Destek", className: "from-red-500 to-rose-600" }
      : null,
  ].filter(
    (badge): badge is { label: string; className: string } => badge !== null
  );
};

const GameCard = ({
  favorite,
  game,
  onToggleFavorite,
  viewMode,
}: GameCardProps) => {
  const badges = getBadges(game);
  const isList = viewMode === "list";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 ${
        isList ? "grid md:grid-cols-[320px_1fr]" : ""
      }`}
    >
      <div className={`relative ${isList ? "min-h-56" : "h-36"}`}>
        {game.coverImageUrl ? (
          <img
            alt={game.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={game.coverImageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 text-sm text-slate-400">
            Kapak görseli yok
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow-lg ${badge.className}`}
              key={badge.label}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <button
          aria-label="Toggle favorite"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-black/40 text-lg text-white backdrop-blur transition hover:border-violet-300"
          onClick={() => onToggleFavorite(game.id)}
          type="button"
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-white">{game.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>{game.genre ?? "Tür yok"}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>{game.platform ?? "Platform yok"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-500">▣</span>
          <span>{formatDate(game.releaseDate)}</span>
        </div>

        <p className="min-h-12 text-sm leading-6 text-slate-300">
          {game.description ?? "Açıklama bulunmuyor."}
        </p>

        <div className="flex items-center gap-3">
          <a
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/50"
            href={GAME_ROUTES.gameDetail(game.id)}
          >
            Görüntüle
          </a>
          <a
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-indigo-500 hover:to-violet-500"
            href={GAME_ROUTES.editGame(game.id)}
          >
            Düzenle
          </a>
          <button
            aria-label="Open game actions"
            className="rounded-lg px-3 py-2 text-xl leading-none text-slate-400 transition hover:bg-white/5 hover:text-white"
            type="button"
          >
            ⋮
          </button>
        </div>
      </div>
    </article>
  );
};

export default GameCard;
