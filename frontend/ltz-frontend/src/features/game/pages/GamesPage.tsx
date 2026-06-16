import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import GameCard from "../components/GameCard";
import type { GameCardViewMode } from "../components/GameCard";
import {
  createGame,
  getGameCategories,
  getGamesByFilter,
} from "../services/gameService";
import {
  getExternalAppsPage,
  getExternalGameTags,
  searchExternalGames,
} from "../services/externalGameService";
import type { Game, GameCategory, GameRequest } from "../types/gameTypes";
import type {
  ExternalGameSearchResponse,
  ExternalGameTag,
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
const ALL_CATEGORIES_VALUE = "all";
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

type CategoryOption = {
  externalId?: string | null;
  id?: number | string;
  name: string;
  source?: GameSource | null;
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

const normalizeCategory = (value: string) => {
  return value.trim().toLocaleLowerCase("tr-TR");
};

const getSelectedCategoryTag = (selectedCategory: string) => {
  return selectedCategory === ALL_CATEGORIES_VALUE ? undefined : selectedCategory;
};

const collectCategoryValues = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectCategoryValues);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const namedValue = ["name", "title", "label", "description"].find(
        (key) =>
            typeof record[key] === "string" &&
            Boolean((record[key] as string).trim())
    );

    if (namedValue) {
      return collectCategoryValues(record[namedValue]);
    }

    return Object.keys(record)
        .map((key) => key.trim())
        .filter(Boolean);
  }

  return [];
};

const getGameCategoryLabels = (game: Game | ExternalGameSearchResponse) => {
  const record = game as Record<string, unknown>;

  return [
    record.categoryName,
    record.genre,
    record.genres,
    record.category,
    record.categories,
    record.tag,
    record.tags,
    record.steamSpyTags,
    record.steamTags,
    record.externalCategories,
    record.externalTags,
  ]
      .flatMap(collectCategoryValues)
      .map((category) => category.trim())
      .filter(Boolean);
};

const hasCategoryMatch = (
    game: Game | ExternalGameSearchResponse,
    selectedCategory: string
) => {
  const normalizedSelectedCategory = normalizeCategory(selectedCategory);
  const categoryLabels = getGameCategoryLabels(game);

  if (categoryLabels.length === 0) {
    return false;
  }

  return categoryLabels.some((category) => {
    const normalizedGameCategory = normalizeCategory(category);

    return (
        normalizedGameCategory === normalizedSelectedCategory ||
        normalizedGameCategory.includes(normalizedSelectedCategory) ||
        normalizedSelectedCategory.includes(normalizedGameCategory)
    );
  });
};

const toManualCategoryOption = (category: GameCategory): CategoryOption => ({
  id: category.id,
  name: category.name,
  source: category.source,
});

const toExternalCategoryOption = (category: ExternalGameTag): CategoryOption => ({
  externalId: category.externalId,
  name: category.name,
  source: category.source,
});

const mergeCategoryOptions = (options: CategoryOption[]) => {
  const categoryMap = new Map<string, CategoryOption>();

  options.forEach((option) => {
    const categoryName = option.name.trim();

    if (!categoryName) {
      return;
    }

    const key = normalizeCategory(categoryName);

    if (!categoryMap.has(key)) {
      categoryMap.set(key, { ...option, name: categoryName });
    }
  });

  return Array.from(categoryMap.values()).sort((firstCategory, nextCategory) =>
      firstCategory.name.localeCompare(nextCategory.name, "tr")
  );
};

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const startPage =
      Math.floor((currentPage - 1) / PAGINATION_WINDOW_SIZE) *
      PAGINATION_WINDOW_SIZE +
      1;

  const endPage = Math.min(totalPages, startPage + PAGINATION_WINDOW_SIZE - 1);

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
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
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
  const categoryFilterRef = useRef<HTMLDivElement | null>(null);

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
            : results[0]?.id ?? null,
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

  const fetchCategoryOptions = async (nextSource: GameSource) => {
    const [externalCategoriesResult, manualCategoriesResult] =
        await Promise.allSettled([
          getExternalGameTags(nextSource),
          getGameCategories(nextSource),
        ]);

    const externalOptions =
        externalCategoriesResult.status === "fulfilled"
            ? externalCategoriesResult.value.map(toExternalCategoryOption)
            : [];

    const manualOptions =
        manualCategoriesResult.status === "fulfilled"
            ? manualCategoriesResult.value.map(toManualCategoryOption)
            : [];

    setCategoryOptions(mergeCategoryOptions([...externalOptions, ...manualOptions]));
  };

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
      nextPerPage = perPage,
      nextSelectedCategory = selectedCategory
  ) => {
    const trimmedQuery = rawQuery.trim();
    const selectedTag = getSelectedCategoryTag(nextSelectedCategory);

    clearScheduledSearch();

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      if (trimmedQuery) {
        const searchResults = await searchExternalGames(nextSource, trimmedQuery);

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
          nextPerPage,
          selectedTag
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

  const scheduleSearch = (
      nextQuery: string,
      nextSource: GameSource = source,
      nextSelectedCategory = selectedCategory
  ) => {
    clearScheduledSearch();

    searchTimeoutRef.current = window.setTimeout(() => {
      void runSearch(nextQuery, nextSource, 1, perPage, nextSelectedCategory);
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    void fetchManualGames("STEAM");
    void fetchCategoryOptions("STEAM");
    void runSearch("", "STEAM", 1, perPage, ALL_CATEGORIES_VALUE);

    return () => {
      clearScheduledSearch();
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (
          categoryFilterRef.current &&
          event.target instanceof Node &&
          !categoryFilterRef.current.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
    scheduleSearch(nextQuery, source, selectedCategory);
  };

  const handleSourceChange = (nextSource: GameSource) => {
    setSource(nextSource);
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setCategorySearchTerm("");
    setIsCategoryDropdownOpen(false);
    setPage(1);
    setNotice(null);

    void fetchManualGames(nextSource);
    void fetchCategoryOptions(nextSource);
    void runSearch(query, nextSource, 1, perPage, ALL_CATEGORIES_VALUE);
  };

  const selectAllCategories = () => {
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setCategorySearchTerm("");
    setIsCategoryDropdownOpen(false);
    setPage(1);

    void runSearch(query, source, 1, perPage, ALL_CATEGORIES_VALUE);
  };

  const handleCategorySelect = (category: CategoryOption) => {
    setSelectedCategory(category.name);
    setCategorySearchTerm(category.name);
    setIsCategoryDropdownOpen(false);
    setPage(1);

    void runSearch(query, source, 1, perPage, category.name);
  };

  const handleCategorySearchChange = (nextSearchTerm: string) => {
    setCategorySearchTerm(nextSearchTerm);
    setIsCategoryDropdownOpen(true);
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setPage(1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query, source, 1, perPage, selectedCategory);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);

    if (!query.trim()) {
      void runSearch("", source, nextPage, perPage, selectedCategory);
    }
  };

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);

    if (!query.trim()) {
      void runSearch("", source, 1, nextPerPage, selectedCategory);
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
      await runSearch(query, createdSource, 1, perPage, selectedCategory);
    } catch (createError) {
      setFormError(
          getCreateErrorMessage(createError, "Oyun eklenirken bir hata oluştu.")
      );
    } finally {
      setCreatingGame(false);
    }
  };

  const isSearchMode = Boolean(query.trim());
  const isCategoryFilterActive = selectedCategory !== ALL_CATEGORIES_VALUE;

  const filteredCategoryOptions = useMemo(() => {
    const normalizedSearchTerm = normalizeCategory(categorySearchTerm);

    if (!normalizedSearchTerm) {
      return categoryOptions;
    }

    return categoryOptions.filter((category) =>
        normalizeCategory(category.name).includes(normalizedSearchTerm)
    );
  }, [categoryOptions, categorySearchTerm]);

  const manualGamesForList = useMemo(() => {
    const trimmedQuery = query.trim().toLocaleLowerCase("tr-TR");

    const filteredByQuery = trimmedQuery
        ? manualGames.filter((game) => {
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
              .toLocaleLowerCase("tr-TR");

          return searchableText.includes(trimmedQuery);
        })
        : manualGames;

    const filteredByCategory = isCategoryFilterActive
        ? filteredByQuery.filter((game) => hasCategoryMatch(game, selectedCategory))
        : filteredByQuery;

    if (!trimmedQuery) {
      return page === 1 ? filteredByCategory : [];
    }

    return filteredByCategory;
  }, [isCategoryFilterActive, manualGames, page, query, selectedCategory]);

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

  const filteredListedGames = listedGames;

  const usesClientPagination = isSearchMode;

  const clientTotalPages = Math.max(
      1,
      Math.ceil(filteredListedGames.length / perPage)
  );

  const totalPages = usesClientPagination ? clientTotalPages : externalTotalPages;
  const currentPage = Math.min(page, totalPages);
  const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  const visibleGames = useMemo(() => {
    if (!usesClientPagination) {
      return filteredListedGames;
    }

    return filteredListedGames.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );
  }, [currentPage, filteredListedGames, perPage, usesClientPagination]);

  const displayedResultCount = usesClientPagination
      ? filteredListedGames.length
      : externalTotalItems + manualGamesForList.length;

  const gameSubmitDisabled =
      creatingGame ||
      categoriesLoading ||
      formCategories.length === 0 ||
      !gameForm.title.trim();

  return (
      <div className="relative bg-[#020817] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

        <div className="relative min-h-screen">
          <main className="mx-auto max-w-[1840px] px-8 py-8">
            <section className="mb-7 flex justify-end">
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
                className="relative z-[80] rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl"
                onSubmit={handleSubmit}
            >
              <div className="grid gap-4 lg:grid-cols-[220px_260px_1fr_auto]">
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

                <div
                    className="relative z-[90] space-y-2"
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setIsCategoryDropdownOpen(false);
                      }
                    }}
                    ref={categoryFilterRef}
                >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Kategori
                </span>

                  <div className="relative">
                    <input
                        className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 pr-20 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/70"
                        onChange={(event) =>
                            handleCategorySearchChange(event.target.value)
                        }
                        onFocus={() => setIsCategoryDropdownOpen(true)}
                        placeholder="Kategori ara veya seç"
                        type="text"
                        value={categorySearchTerm}
                    />

                    {categorySearchTerm ? (
                        <button
                            aria-label="Kategori seçimini temizle"
                            className="absolute right-10 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-sm font-black text-slate-400 hover:bg-white/10 hover:text-white"
                            onClick={selectAllCategories}
                            type="button"
                        >
                          x
                        </button>
                    ) : null}

                    <button
                        aria-label="Kategori listesini aç"
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                        onClick={() =>
                            setIsCategoryDropdownOpen((isOpen) => !isOpen)
                        }
                        type="button"
                    >
                      v
                    </button>
                  </div>

                  {isCategoryDropdownOpen ? (
                      <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/98 p-2 shadow-2xl shadow-black/70 backdrop-blur-xl">
                        <button
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                                selectedCategory === ALL_CATEGORIES_VALUE
                                    ? "bg-violet-600 text-white"
                                    : "text-slate-200 hover:bg-white/10"
                            }`}
                            onClick={selectAllCategories}
                            type="button"
                        >
                          <span className="truncate">Tüm Kategoriler</span>
                        </button>

                        {filteredCategoryOptions.length > 0 ? (
                            filteredCategoryOptions.map((category) => (
                                <button
                                    className={`mt-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                                        selectedCategory === category.name
                                            ? "bg-violet-600 text-white"
                                            : "text-slate-200 hover:bg-white/10"
                                    }`}
                                    key={`${
                                        category.source ?? "all"
                                    }-${category.externalId ?? category.id ?? category.name}`}
                                    onClick={() => handleCategorySelect(category)}
                                    type="button"
                                >
                                  <span className="truncate">{category.name}</span>

                                  {category.source ? (
                                      <span className="shrink-0 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                              {category.source}
                            </span>
                                  ) : null}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-slate-400">
                              Kategori bulunamadı.
                            </div>
                        )}
                      </div>
                  ) : null}
                </div>

                <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Oyun adı
                </span>

                  <input
                      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/70"
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
                  {query.trim() || isCategoryFilterActive
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
                <div className="relative z-10 mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
                  {notice}
                </div>
            ) : null}

            <section className="relative z-0 mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
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
              !isCategoryFilterActive &&
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
              (Boolean(query.trim()) || isCategoryFilterActive) &&
              visibleGames.length === 0 ? (
                  <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                    <div>
                      <h2 className="text-xl font-bold text-white">Oyun bulunamadı</h2>

                      <p className="mt-2 text-sm text-slate-400">
                        Farklı bir {sourceLabel(source)} oyun adı veya kategori ile
                        tekrar arama yapmayı deneyin.
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

              {filteredListedGames.length > 0 ? (
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

                      {visiblePageNumbers.map((pageNumber) => (
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
                      ))}

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