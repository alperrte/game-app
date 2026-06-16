export type GameViewMode = "grid" | "list";
export type GameSortOption = "newest" | "oldest" | "popular";

export type GameListFilters = {
  earlyAccess: boolean;
  genre: string;
  onSale: boolean;
  platform: string;
  search: string;
  turkishLanguageSupport: boolean;
};

type GameFilterFormProps = {
  filters: GameListFilters;
  genres: string[];
  onFiltersChange: (filters: GameListFilters) => void;
  onSortChange: (sort: GameSortOption) => void;
  onViewModeChange: (viewMode: GameViewMode) => void;
  platforms: string[];
  sort: GameSortOption;
  viewMode: GameViewMode;
};

const chipClass = (active: boolean) =>
  `inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
    active
      ? "border-violet-400/60 bg-violet-500/20 text-white shadow-lg shadow-violet-950/30"
      : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-violet-300/40"
  }`;

const GameFilterForm = ({
  filters,
  genres,
  onFiltersChange,
  onSortChange,
  onViewModeChange,
  platforms,
  sort,
  viewMode,
}: GameFilterFormProps) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="grid gap-4 2xl:grid-cols-[1.6fr_0.9fr_1fr_0.85fr_0.75fr_0.9fr_1.1fr_auto]">
        <label className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
            ⌕
          </span>
          <input
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/70"
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Oyun ara..."
            value={filters.search}
          />
        </label>

        <select
          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-medium text-white outline-none transition focus:border-violet-400/70"
          onChange={(event) =>
            onFiltersChange({ ...filters, genre: event.target.value })
          }
          value={filters.genre}
        >
          <option value="">Tüm Türler</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select
          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-medium text-white outline-none transition focus:border-violet-400/70"
          onChange={(event) =>
            onFiltersChange({ ...filters, platform: event.target.value })
          }
          value={filters.platform}
        >
          <option value="">Tüm Platformlar</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <button
          className={chipClass(filters.earlyAccess)}
          onClick={() =>
            onFiltersChange({
              ...filters,
              earlyAccess: !filters.earlyAccess,
            })
          }
          type="button"
        >
          <span>⌛</span>
          Erken Erişim
        </button>

        <button
          className={chipClass(filters.onSale)}
          onClick={() =>
            onFiltersChange({ ...filters, onSale: !filters.onSale })
          }
          type="button"
        >
          <span>◇</span>
          İndirimde
        </button>

        <button
          className={chipClass(filters.turkishLanguageSupport)}
          onClick={() =>
            onFiltersChange({
              ...filters,
              turkishLanguageSupport: !filters.turkishLanguageSupport,
            })
          }
          type="button"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px]">
            TR
          </span>
          Türkçe Destek
        </button>

        <label className="grid h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-1 text-xs text-slate-500">
          Sırala
          <select
            className="bg-transparent text-sm font-semibold text-white outline-none"
            onChange={(event) => onSortChange(event.target.value as GameSortOption)}
            value={sort}
          >
            <option value="newest">En Yeni Önce</option>
            <option value="oldest">En Eski Önce</option>
            <option value="popular">En Popüler</option>
          </select>
        </label>

        <div className="flex h-12 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-1">
          <button
            aria-label="Izgara görünümü"
            className={`grid w-12 place-items-center rounded-lg text-lg transition ${
              viewMode === "grid"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => onViewModeChange("grid")}
            type="button"
          >
            ▦
          </button>
          <button
            aria-label="Liste görünümü"
            className={`grid w-12 place-items-center rounded-lg text-lg transition ${
              viewMode === "list"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => onViewModeChange("list")}
            type="button"
          >
            ☰
          </button>
        </div>
      </div>
    </section>
  );
};

export default GameFilterForm;
