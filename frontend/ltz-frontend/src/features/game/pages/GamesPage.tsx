import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import GameCard from "../components/GameCard";
import type { GameCardViewMode } from "../components/GameCard";
import GameNavbar from "../components/GameNavbar";
import {
  createGame,
  getGameCategories,
  getGamesByFilter,
} from "../services/gameService";
import {
  getExternalAppsPage,
  searchExternalGames,
} from "../services/externalGameService";
import type { Game, GameCategory, GameRequest } from "../types/gameTypes";
import type {
  ExternalGameSearchResponse,
  GameSource,
} from "../types/externalGame.types";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

const SEARCH_DEBOUNCE_MS = 450;
const PAGINATION_WINDOW_SIZE = 30;
const SOURCE_OPTIONS: GameSource[] = ["STEAM", "EPIC"];

type GameListItem =
    | {
  game: ExternalGameSearchResponse;
  origin: "external";
}
    | {
  game: Game;
  origin: "manual";
};

const initialGameForm: GameRequest = {
  source: "STEAM",
  categoryId: null,
  title: "",
  description: "",
  genre: "",
  platform: "",
  releaseDate: "",
  developer: "",
  publisher: "",
  minimumSystemRequirements: "",
  recommendedSystemRequirements: "",
  supportedLanguages: "",
  coverImageUrl: "",
  earlyAccess: false,
  onSale: false,
  turkishLanguageSupport: false,
  popularityScore: 0,
};

const sourceLabel = (source: GameSource) => {
  return source === "STEAM" ? "Steam" : "Epic";
};

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const startPage =
      Math.floor((currentPage - 1) / PAGINATION_WINDOW_SIZE) *
      PAGINATION_WINDOW_SIZE +
      1;
  const endPage = Math.min(
      totalPages,
      startPage + PAGINATION_WINDOW_SIZE - 1
  );

  return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
  );
};

const getSearchErrorMessage = (error: unknown, source: GameSource) => {
  if (isAxiosError(error) && error.response?.status === 501) {
    return "Bu oyun kaynağı henüz aktif değil.";
  }

  return getErrorMessage(
      error,
      `${sourceLabel(source)} oyunları aranırken bir hata oluştu.`
  );
};

const getCreateErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 403) {
      return ADMIN_ACTION_MESSAGE;
    }

    if (status === 401) {
      return "Bu işlem için yetkiniz yok veya oturumunuz sona ermiş olabilir.";
    }

    if (status === 409) {
      return "Bu kayıt bu platform için zaten mevcut.";
    }
  }

  return fallback;
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizeGameRequest = (value: GameRequest): GameRequest => {
  return {
    source: value.source,
    categoryId: value.categoryId ?? null,
    title: value.title.trim(),
    description: emptyToNull(value.description),
    genre: emptyToNull(value.genre),
    platform: emptyToNull(value.platform),
    releaseDate: emptyToNull(value.releaseDate),
    developer: emptyToNull(value.developer),
    publisher: emptyToNull(value.publisher),
    minimumSystemRequirements: emptyToNull(value.minimumSystemRequirements),
    recommendedSystemRequirements: emptyToNull(
        value.recommendedSystemRequirements
    ),
    supportedLanguages: emptyToNull(value.supportedLanguages),
    coverImageUrl: emptyToNull(value.coverImageUrl),
    earlyAccess: value.earlyAccess ?? false,
    onSale: value.onSale ?? false,
    turkishLanguageSupport: value.turkishLanguageSupport ?? false,
    popularityScore: value.popularityScore ?? 0,
  };
};

const GamesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [games, setGames] = useState<ExternalGameSearchResponse[]>([]);
  const [manualGames, setManualGames] = useState<Game[]>([]);
  const [source, setSource] = useState<GameSource>("STEAM");
  const [query, setQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [externalTotalItems, setExternalTotalItems] = useState(0);
  const [externalTotalPages, setExternalTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<GameCardViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [manualGamesLoading, setManualGamesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualGamesError, setManualGamesError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameForm, setGameForm] = useState<GameRequest>(initialGameForm);
  const [formCategories, setFormCategories] = useState<GameCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const fetchManualGames = async (nextSource: GameSource) => {
    setManualGamesLoading(true);
    setManualGamesError(null);

    try {
      const results = await getGamesByFilter({ source: nextSource });
      setManualGames(results);
    } catch (manualGamesLoadError) {
      setManualGames([]);
      setManualGamesError(
          getErrorMessage(
              manualGamesLoadError,
              "Manuel oyunlar yüklenirken bir hata oluştu."
          )
      );
    } finally {
      setManualGamesLoading(false);
    }
  };

  const fetchFormCategories = async (nextSource: GameSource) => {
    setCategoriesLoading(true);
    setFormError(null);

    try {
      const results = await getGameCategories(nextSource);
      setFormCategories(results);
      setGameForm((currentForm) => ({
        ...currentForm,
        categoryId: results.some(
            (category) => category.id === currentForm.categoryId
        )
            ? currentForm.categoryId
            : (results[0]?.id ?? null),
      }));
    } catch (categoryLoadError) {
      setFormCategories([]);
      setGameForm((currentForm) => ({ ...currentForm, categoryId: null }));
      setFormError(
          getErrorMessage(
              categoryLoadError,
              "Kategoriler yüklenirken bir hata oluştu."
          )
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    void fetchManualGames("STEAM");
    void runSearch("", "STEAM", 1, perPage);

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

  const runSearch = async (
      rawQuery: string,
      nextSource: GameSource = source,
      nextPage = 1,
      nextPerPage = perPage
  ) => {
    const trimmedQuery = rawQuery.trim();

    clearScheduledSearch();

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      if (trimmedQuery) {
        const searchResults = await searchExternalGames(
            nextSource,
            trimmedQuery
        );

        if (requestIdRef.current === requestId) {
          setGames(searchResults);
          setExternalTotalItems(searchResults.length);
          setExternalTotalPages(
              Math.max(1, Math.ceil(searchResults.length / nextPerPage))
          );
          setPage(1);
        }

        return;
      }

      const appsPage = await getExternalAppsPage(
          nextSource,
          nextPage,
          nextPerPage
      );

      if (requestIdRef.current === requestId) {
        setGames(appsPage.items);
        setExternalTotalItems(appsPage.totalItems);
        setExternalTotalPages(Math.max(1, appsPage.totalPages));
        setPage(appsPage.page);
      }
    } catch (searchError) {
      if (requestIdRef.current === requestId) {
        setGames([]);
        setExternalTotalItems(0);
        setExternalTotalPages(1);
        setError(getSearchErrorMessage(searchError, nextSource));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const scheduleSearch = (nextQuery: string, nextSource: GameSource = source) => {
    clearScheduledSearch();

    searchTimeoutRef.current = window.setTimeout(() => {
      void runSearch(nextQuery, nextSource, 1, perPage);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
    scheduleSearch(nextQuery, source);
  };

  const handleSourceChange = (nextSource: GameSource) => {
    setSource(nextSource);
    setPage(1);
    setNotice(null);
    void fetchManualGames(nextSource);

    void runSearch(query, nextSource, 1, perPage);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query, source, 1, perPage);
  };

  const handlePageChange = (nextPage: number) => {
    if (query.trim()) {
      setPage(nextPage);
      return;
    }

    void runSearch("", source, nextPage, perPage);
  };

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);

    if (!query.trim()) {
      void runSearch("", source, 1, nextPerPage);
    }
  };

  const toggleFavorite = (externalId: string) => {
    setFavoriteIds((currentIds) =>
        currentIds.includes(externalId)
            ? currentIds.filter((id) => id !== externalId)
            : [...currentIds, externalId]
    );
  };

  const openModal = () => {
    const nextForm = { ...initialGameForm, source };

    setGameForm(nextForm);
    setFormError(null);
    setIsModalOpen(true);
    void fetchFormCategories(source);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGameForm(initialGameForm);
    setFormCategories([]);
    setFormError(null);
    setCreatingGame(false);
  };

  const setGameField = <TKey extends keyof GameRequest>(
      key: TKey,
      value: GameRequest[TKey]
  ) => {
    setGameForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const handleFormSourceChange = (nextSource: GameSource) => {
    setGameForm((currentForm) => ({
      ...currentForm,
      source: nextSource,
      categoryId: null,
    }));
    void fetchFormCategories(nextSource);
  };

  const handleCreateGame = async () => {
    if (!isAdmin) {
      setFormError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const request = normalizeGameRequest(gameForm);

    if (!request.title) {
      setFormError("Oyun adı zorunludur.");
      return;
    }

    if (formCategories.length === 0) {
      setFormError("Bu platform için önce kategori eklemelisin.");
      return;
    }

    setCreatingGame(true);
    setFormError(null);

    try {
      await createGame(request);
      closeModal();
      setNotice("Oyun başarıyla eklendi.");
      const createdSource = request.source ?? source;

      setSource(createdSource);
      await fetchManualGames(createdSource);

      await runSearch(query, createdSource, 1, perPage);
    } catch (createError) {
      setFormError(
          getCreateErrorMessage(createError, "Oyun eklenirken bir hata oluştu.")
      );
    } finally {
      setCreatingGame(false);
    }
  };

  const isSearchMode = Boolean(query.trim());

  const manualGamesForList = useMemo(() => {
    const trimmedQuery = query.trim().toLocaleLowerCase("tr");

    if (!trimmedQuery) {
      return page === 1 ? manualGames : [];
    }

    return manualGames.filter((game) => {
      const searchableText = [
        game.title,
        game.description,
        game.genre,
        game.platform,
        game.developer,
        game.publisher,
        game.categoryName,
      ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr");

      return searchableText.includes(trimmedQuery);
    });
  }, [manualGames, page, query]);

  const listedGames = useMemo<GameListItem[]>(
      () => [
        ...games.map((game) => ({ game, origin: "external" as const })),
        ...manualGamesForList.map((game) => ({
          game,
          origin: "manual" as const,
        })),
      ],
      [games, manualGamesForList]
  );

  const searchTotalPages = Math.max(1, Math.ceil(listedGames.length / perPage));
  const totalPages = isSearchMode ? searchTotalPages : externalTotalPages;
  const currentPage = Math.min(page, totalPages);
  const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  const visibleGames = useMemo(() => {
    if (!isSearchMode) {
      return listedGames;
    }

    return listedGames.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );
  }, [currentPage, isSearchMode, listedGames, perPage]);

  const displayedResultCount = isSearchMode
      ? listedGames.length
      : externalTotalItems + manualGames.length;

  const gameSubmitDisabled =
      creatingGame ||
      categoriesLoading ||
      formCategories.length === 0 ||
      !gameForm.title.trim();

  return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

        <div className="relative min-h-screen">
          <GameNavbar activeItem="Games" />

          <main className="mx-auto max-w-[1840px] px-8 py-8">
            <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl font-black text-violet-300 shadow-2xl shadow-violet-950/40">
                  {source === "STEAM" ? "ST" : "EP"}
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white">
                    Oyunlar
                  </h1>
                  <p className="mt-3 text-base text-slate-400">
                    {sourceLabel(source)} oyunlarını backend üzerinden ara ve
                    manuel kayıtlarla birlikte görüntüle.
                  </p>
                </div>
              </div>

              {isAdmin ? (
                  <button
                      className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                      onClick={openModal}
                      type="button"
                  >
                    <span className="text-3xl font-light leading-none">+</span>
                    Oyun Ekle
                  </button>
              ) : null}
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
                      className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm font-semibold text-white outline-none"
                      onChange={(event) =>
                          handleSourceChange(event.target.value as GameSource)
                      }
                      value={source}
                  >
                    {SOURCE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {sourceLabel(option)}
                        </option>
                    ))}
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
                  {query.trim()
                      ? `${displayedResultCount} ${sourceLabel(source)} sonucu`
                      : `${displayedResultCount} ${sourceLabel(source)} oyunu`}
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
                    Izgara
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

              {manualGamesError ? (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-950/25 px-5 py-3 text-sm text-red-100">
                    {manualGamesError}
                  </div>
              ) : null}

              {loading && !manualGamesLoading ? (
                  <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100">
                    Harici veriler yükleniyor...
                  </div>
              ) : null}
            </form>

            {notice ? (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
                  {notice}
                </div>
            ) : null}

            <section className="mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
              {(loading || manualGamesLoading) && visibleGames.length === 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {Array.from({ length: perPage }).map((_, index) => (
                        <div
                            className="h-80 animate-pulse rounded-2xl border border-white/10 bg-slate-900/70"
                            key={index}
                        />
                    ))}
                  </div>
              ) : null}

              {!loading &&
              !manualGamesLoading &&
              !query.trim() &&
              visibleGames.length === 0 ? (
                  <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                    <div>
                      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-2xl font-black text-violet-300">
                        {source === "STEAM" ? "ST" : "EP"}
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {sourceLabel(source)} oyunu bulunamadı
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Bu kaynak için listelenecek oyun bulunamadı.
                      </p>
                    </div>
                  </div>
              ) : null}

              {!loading &&
              !manualGamesLoading &&
              Boolean(query.trim()) &&
              visibleGames.length === 0 ? (
                  <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Oyun bulunamadı
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Farklı bir {sourceLabel(source)} oyun adı ile tekrar arama
                        yapmayı deneyin.
                      </p>
                    </div>
                  </div>
              ) : null}

              {!manualGamesLoading && visibleGames.length > 0 ? (
                  <div
                      className={
                        viewMode === "grid"
                            ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
                            : "grid gap-4"
                      }
                  >
                    {visibleGames.map((item) =>
                        item.origin === "external" ? (
                            <GameCard
                                favorite={favoriteIds.includes(item.game.externalId)}
                                game={item.game}
                                key={`${item.game.source}-${item.game.externalId}`}
                                onToggleFavorite={toggleFavorite}
                                origin="external"
                                viewMode={viewMode}
                            />
                        ) : (
                            <GameCard
                                game={item.game}
                                key={`${item.game.source}-manual-${item.game.id}`}
                                origin="manual"
                                viewMode={viewMode}
                            />
                        )
                    )}
                  </div>
              ) : null}

              {listedGames.length > 0 ? (
                  <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 pb-1">
                    <div className="flex items-center gap-2">
                      <button
                          className="grid h-10 place-items-center rounded-xl bg-slate-900/80 px-3 text-sm text-slate-300 disabled:opacity-40"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          type="button"
                      >
                        Önceki
                      </button>
                      {visiblePageNumbers.map(
                          (pageNumber) => {
                            return (
                                <button
                                    className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold ${
                                        currentPage === pageNumber
                                            ? "bg-violet-600 text-white"
                                            : "text-slate-300 hover:bg-white/5"
                                    }`}
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    type="button"
                                >
                                  {pageNumber}
                                </button>
                            );
                          }
                      )}
                      <button
                          className="grid h-10 place-items-center rounded-xl bg-slate-900/80 px-3 text-sm text-slate-300 disabled:opacity-40"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                              handlePageChange(Math.min(totalPages, currentPage + 1))
                          }
                          type="button"
                      >
                        Sonraki
                      </button>
                    </div>

                    <label className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                      <select
                          className="bg-transparent text-sm text-slate-200 outline-none"
                          onChange={(event) =>
                              handlePerPageChange(Number(event.target.value))
                          }
                          value={perPage}
                      >
                        <option className="bg-slate-950 text-white" value={6}>
                          Sayfa başına 6
                        </option>
                        <option className="bg-slate-950 text-white" value={12}>
                          Sayfa başına 12
                        </option>
                        <option className="bg-slate-950 text-white" value={24}>
                          Sayfa başına 24
                        </option>
                      </select>
                    </label>
                  </footer>
              ) : null}
            </section>
          </main>
        </div>

        {isModalOpen ? (
            <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
              <section className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Oyun Ekle</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Steam veya Epic için manuel oyun kaydı oluştur.
                    </p>
                  </div>
                  <button
                      aria-label="Modalı kapat"
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/5 text-xl text-slate-400 hover:bg-white/10"
                      onClick={closeModal}
                      type="button"
                  >
                    x
                  </button>
                </div>

                <form
                    className="space-y-5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleCreateGame();
                    }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Platform / Sağlayıcı
                  </span>
                      <select
                          className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                          onChange={(event) =>
                              handleFormSourceChange(event.target.value as GameSource)
                          }
                          value={gameForm.source}
                      >
                        <option value="STEAM">STEAM</option>
                        <option value="EPIC">EPIC</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Kategori</span>
                      <select
                          className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-violet-400/70"
                          disabled={categoriesLoading || formCategories.length === 0}
                          onChange={(event) =>
                              setGameField("categoryId", Number(event.target.value))
                          }
                          value={gameForm.categoryId ?? ""}
                      >
                        <option value="">
                          {categoriesLoading
                              ? "Kategoriler yükleniyor..."
                              : "Kategori seç"}
                        </option>
                        {formCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                        ))}
                      </select>
                      {!categoriesLoading && formCategories.length === 0 ? (
                          <span className="text-sm text-amber-200">
                      Bu platform için önce kategori eklemelisin.
                    </span>
                      ) : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Oyun adı</span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={150}
                          onChange={(event) =>
                              setGameField("title", event.target.value)
                          }
                          placeholder="Oyun adını girin"
                          required
                          value={gameForm.title}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Tür</span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={100}
                          onChange={(event) =>
                              setGameField("genre", event.target.value)
                          }
                          placeholder="Action"
                          value={gameForm.genre ?? ""}
                      />
                    </label>

                    <label className="grid gap-2 md:col-span-2">
                      <span className="text-sm font-bold text-white">Açıklama</span>
                      <textarea
                          className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={3000}
                          onChange={(event) =>
                              setGameField("description", event.target.value)
                          }
                          placeholder="Oyunun kısa açıklaması"
                          value={gameForm.description ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Platform bilgisi
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={100}
                          onChange={(event) =>
                              setGameField("platform", event.target.value)
                          }
                          placeholder="Windows"
                          value={gameForm.platform ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Çıkış tarihi
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                          onChange={(event) =>
                              setGameField("releaseDate", event.target.value)
                          }
                          type="date"
                          value={gameForm.releaseDate ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Geliştirici
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={150}
                          onChange={(event) =>
                              setGameField("developer", event.target.value)
                          }
                          placeholder="LTZ Studio"
                          value={gameForm.developer ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Yayıncı</span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={150}
                          onChange={(event) =>
                              setGameField("publisher", event.target.value)
                          }
                          placeholder="LobbyTwoZero"
                          value={gameForm.publisher ?? ""}
                      />
                    </label>

                    <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-bold text-white">
                    Kapak görseli URL
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={500}
                          onChange={(event) =>
                              setGameField("coverImageUrl", event.target.value)
                          }
                          placeholder="https://example.com/game.jpg"
                          value={gameForm.coverImageUrl ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum sistem gereksinimleri
                  </span>
                      <textarea
                          className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={2000}
                          onChange={(event) =>
                              setGameField(
                                  "minimumSystemRequirements",
                                  event.target.value
                              )
                          }
                          value={gameForm.minimumSystemRequirements ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen sistem gereksinimleri
                  </span>
                      <textarea
                          className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={2000}
                          onChange={(event) =>
                              setGameField(
                                  "recommendedSystemRequirements",
                                  event.target.value
                              )
                          }
                          value={gameForm.recommendedSystemRequirements ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Desteklenen diller
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={500}
                          onChange={(event) =>
                              setGameField("supportedLanguages", event.target.value)
                          }
                          placeholder="Turkish, English"
                          value={gameForm.supportedLanguages ?? ""}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Popülerlik puanı
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                          min={0}
                          onChange={(event) =>
                              setGameField(
                                  "popularityScore",
                                  Number(event.target.value)
                              )
                          }
                          type="number"
                          value={gameForm.popularityScore ?? 0}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["earlyAccess", "Erken erişim"],
                      ["onSale", "İndirimde mi"],
                      ["turkishLanguageSupport", "Türkçe dil desteği"],
                    ].map(([key, label]) => (
                        <label
                            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-white"
                            key={key}
                        >
                          {label}
                          <input
                              checked={gameForm[key as keyof GameRequest] === true}
                              className="h-4 w-4 cursor-pointer"
                              onChange={(event) =>
                                  setGameField(
                                      key as keyof GameRequest,
                                      event.target.checked
                                  )
                              }
                              type="checkbox"
                          />
                        </label>
                    ))}
                  </div>

                  {formError ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                        {formError}
                      </div>
                  ) : null}

                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    <button
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={gameSubmitDisabled}
                        type="submit"
                    >
                      {creatingGame ? "Kaydediliyor..." : "Oyun Ekle"}
                    </button>
                    <button
                        className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white"
                        onClick={closeModal}
                        type="button"
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              </section>
            </div>
        ) : null}
      </div>
  );
};

export default GamesPage;
