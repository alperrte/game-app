import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import GameCard from "../components/GameCard";
import type { GameCardViewMode } from "../components/GameCard";
import GameNavbar from "../components/GameNavbar";
import { searchExternalGames } from "../services/externalGameService";
import type {
  ExternalGameSearchResponse,
  GameSource,
} from "../types/externalGame.types";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const STEAM_SOURCE: GameSource = "STEAM";
const SEARCH_DEBOUNCE_MS = 450;

const getSearchErrorMessage = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 501) {
    return "Bu oyun kaynağı henüz aktif değil.";
  }

  return getErrorMessage(error, "Steam oyunları aranırken bir hata oluştu.");
};

const GamesPage = () => {
  const [games, setGames] = useState<ExternalGameSearchResponse[]>([]);
  const [query, setQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<GameCardViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }

      requestIdRef.current += 1;
    };
  }, []);

  const clearScheduledSearch = () => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  const resetSearch = (message: string | null, searched: boolean) => {
    requestIdRef.current += 1;
    setError(message);
    setGames([]);
    setHasSearched(searched);
    setLoading(false);
    setPage(1);
  };

  const runSearch = async (rawQuery: string) => {
    const trimmedQuery = rawQuery.trim();

    clearScheduledSearch();

    if (!trimmedQuery) {
      resetSearch(null, false);
      return;
    }

    if (trimmedQuery.length < 2) {
      resetSearch("Arama yapmak için en az 2 karakter girin.", false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchExternalGames(STEAM_SOURCE, trimmedQuery);

      if (requestIdRef.current === requestId) {
        setGames(results);
        setPage(1);
      }
    } catch (searchError) {
      if (requestIdRef.current === requestId) {
        setGames([]);
        setError(getSearchErrorMessage(searchError));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const scheduleSearch = (nextQuery: string) => {
    clearScheduledSearch();

    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      resetSearch(null, false);
      return;
    }

    if (trimmedQuery.length < 2) {
      resetSearch("Arama yapmak için en az 2 karakter girin.", false);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      void runSearch(nextQuery);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    scheduleSearch(nextQuery);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query);
  };

  const toggleFavorite = (externalId: string) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(externalId)
        ? currentIds.filter((id) => id !== externalId)
        : [...currentIds, externalId]
    );
  };

  const totalPages = Math.max(1, Math.ceil(games.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleGames = useMemo(
    () =>
      games.slice((currentPage - 1) * perPage, currentPage * perPage),
    [currentPage, games, perPage]
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Games" />

        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl font-black text-violet-300 shadow-2xl shadow-violet-950/40">
                ST
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Oyunlar
                </h1>
                <p className="mt-3 text-base text-slate-400">
                  Steam oyunlarını backend üzerinden ara ve detaylarını görüntüle.
                </p>
              </div>
            </div>
          </section>

          <form
            className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto]">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Kaynak
                </span>
                <select
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm font-semibold text-white outline-none"
                  disabled
                  value={STEAM_SOURCE}
                >
                  <option value="STEAM">Steam</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Oyun adı
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/70"
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="Örn. elden ring"
                  type="search"
                  value={query}
                />
              </label>

              <div className="flex items-end">
                <Button className="w-full lg:w-auto" isLoading={loading} type="submit">
                  Ara
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-400">
                {hasSearched
                  ? `${games.length} Steam sonucu`
                  : "Arama için en az 2 karakter girin."}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    viewMode === "grid"
                      ? "bg-violet-600 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  onClick={() => setViewMode("grid")}
                  type="button"
                >
                  Grid
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    viewMode === "list"
                      ? "bg-violet-600 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  onClick={() => setViewMode("list")}
                  type="button"
                >
                  Liste
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-950/25 px-5 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </form>

          <section className="mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: perPage }).map((_, index) => (
                  <div
                    className="h-80 animate-pulse rounded-2xl border border-white/10 bg-slate-900/70"
                    key={index}
                  />
                ))}
              </div>
            ) : null}

            {!loading && !hasSearched ? (
              <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-2xl font-black text-violet-300">
                    ST
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Steam kataloğunda ara
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Sonuçları görmek için oyun adını yazmaya başlayın.
                  </p>
                </div>
              </div>
            ) : null}

            {!loading && hasSearched && visibleGames.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Oyun bulunamadı</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Farklı bir Steam oyun adı ile tekrar arama yapmayı deneyin.
                  </p>
                </div>
              </div>
            ) : null}

            {!loading && visibleGames.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
                    : "grid gap-4"
                }
              >
                {visibleGames.map((game) => (
                  <GameCard
                    favorite={favoriteIds.includes(game.externalId)}
                    game={game}
                    key={`${game.source}-${game.externalId}`}
                    onToggleFavorite={toggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : null}

            {hasSearched && games.length > 0 ? (
              <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 pb-1">
                <div className="flex items-center gap-2">
                  <button
                    className="grid h-10 place-items-center rounded-xl bg-slate-900/80 px-3 text-sm text-slate-300 disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    Önceki
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, index) => {
                      const pageNumber = index + 1;

                      return (
                        <button
                          className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold ${
                            currentPage === pageNumber
                              ? "bg-violet-600 text-white"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          type="button"
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                  )}
                  {totalPages > 5 ? (
                    <span className="px-2 text-slate-500">...</span>
                  ) : null}
                  <button
                    className="grid h-10 place-items-center rounded-xl bg-slate-900/80 px-3 text-sm text-slate-300 disabled:opacity-40"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    type="button"
                  >
                    Sonraki
                  </button>
                </div>

                <label className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  <select
                    className="bg-transparent text-sm text-slate-200 outline-none"
                    onChange={(event) => {
                      setPerPage(Number(event.target.value));
                      setPage(1);
                    }}
                    value={perPage}
                  >
                    <option value={6}>Sayfa başına 6</option>
                    <option value={12}>Sayfa başına 12</option>
                    <option value={24}>Sayfa başına 24</option>
                  </select>
                </label>
              </footer>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
};

export default GamesPage;
