import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

import GameNavbar from "../components/GameNavbar";
import { createGameCategory, getGameCategories } from "../services/gameService";
import { getExternalGameCategories } from "../services/externalGameService";
import type {
  GameCategory,
  GameCategoryRequest,
} from "../types/gameTypes";
import type {
  ExternalGameCategory,
  GameSource,
} from "../types/externalGame.types";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

type CategoryStatusFilter = "all" | "ACTIVE" | "INACTIVE";
type CategoryViewMode = "grid" | "table";
type SortOption = "name-asc" | "name-desc" | "games-asc" | "games-desc";
type CategoryOrigin = "external" | "manual";

type CategoryListItem = {
  dataSource: string;
  description: string;
  externalId?: string;
  gameCount: number;
  id?: number;
  imageUrl?: string | null;
  name: string;
  origin: CategoryOrigin;
  source: GameSource;
  status: string;
};

const initialForm: GameCategoryRequest = {
  source: "STEAM",
  name: "",
  description: "",
};

const SEARCH_DEBOUNCE_MS = 450;

const statusBadgeClass = (status: string) => {
  return status.toUpperCase() === "ACTIVE"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-red-400/20 bg-red-500/15 text-red-200";
};

const sourceLabel = (source: GameSource) => {
  return source === "STEAM" ? "Steam" : "Epic";
};

const normalizeStatus = (status: string) => status.trim().toUpperCase();

const getCreateErrorMessage = (error: unknown) => {
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

  return "Kategori eklenirken bir hata oluştu.";
};

const toExternalCategoryItem = (
  category: ExternalGameCategory
): CategoryListItem => ({
  ...category,
  origin: "external",
});

const toManualCategoryItem = (category: GameCategory): CategoryListItem => ({
  dataSource: "Manuel",
  description: category.description ?? "",
  gameCount: 0,
  id: category.id,
  name: category.name,
  origin: "manual",
  source: category.source,
  status: "ACTIVE",
});

const getCategoryKey = (category: CategoryListItem) => {
  return category.origin === "external"
    ? `${category.source}-external-${category.externalId}`
    : `${category.source}-manual-${category.id}`;
};

const StatCard = ({
  accent,
  helper,
  icon,
  label,
  value,
}: {
  accent: string;
  helper: string;
  icon: string;
  label: string;
  value: string;
}) => {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div
          className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl ${accent}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
      </div>
    </article>
  );
};

const CategoryCardImage = ({
  category,
}: {
  category: CategoryListItem;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = category.imageUrl?.trim();
  const shouldShowImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="h-32 w-full overflow-hidden rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-950/80 via-slate-950 to-cyan-950/70">
      {shouldShowImage ? (
        <img
          alt={category.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={imageUrl}
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-between p-4">
          <span className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
            {category.source}
          </span>
          <div>
            <p className="text-lg font-black text-white">{category.name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              External category
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryListImage = ({
  category,
}: {
  category: CategoryListItem;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = category.imageUrl?.trim();
  const shouldShowImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="h-12 w-20 overflow-hidden rounded-lg border border-violet-400/20 bg-violet-950/40">
      {shouldShowImage ? (
        <img
          alt={category.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={imageUrl}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-bold text-violet-100">
          {category.source}
        </div>
      )}
    </div>
  );
};

const GameCategoriesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [categories, setCategories] = useState<ExternalGameCategory[]>([]);
  const [manualCategories, setManualCategories] = useState<GameCategory[]>([]);
  const [source, setSource] = useState<GameSource>("STEAM");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CategoryStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [minGames, setMinGames] = useState(0);
  const [viewMode, setViewMode] = useState<CategoryViewMode>("table");
  const [formValue, setFormValue] = useState<GameCategoryRequest>(initialForm);
  const [loading, setLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const clearScheduledSearch = () => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  const fetchCategories = async (nextSource: GameSource, rawQuery: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const results = await getExternalGameCategories(
        nextSource,
        rawQuery.trim() || undefined
      );

      if (requestIdRef.current === requestId) {
        setCategories(results);
      }
    } catch (categoryError) {
      if (requestIdRef.current === requestId) {
        console.error("External categories could not be loaded.", categoryError);
        setCategories([]);
        setError(
          getErrorMessage(
            categoryError,
            "Categories could not be loaded for selected source."
          )
        );
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const fetchManualCategories = async (nextSource: GameSource) => {
    setManualLoading(true);
    setManualError(null);

    try {
      const results = await getGameCategories(nextSource);
      setManualCategories(results);
    } catch (manualCategoryError) {
      setManualCategories([]);
      setManualError(
        getErrorMessage(
          manualCategoryError,
          "Manuel kategoriler yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setManualLoading(false);
    }
  };

  const scheduleCategoryFetch = (nextSource: GameSource, nextSearch: string) => {
    clearScheduledSearch();

    searchTimeoutRef.current = window.setTimeout(() => {
      void fetchCategories(nextSource, nextSearch);
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    const initialLoadTimeout = window.setTimeout(() => {
      void fetchCategories("STEAM", "");
      void fetchManualCategories("STEAM");
    }, 0);

    return () => {
      window.clearTimeout(initialLoadTimeout);
      clearScheduledSearch();
      requestIdRef.current += 1;
    };
  }, []);

  const combinedCategories = useMemo(
    () => [
      ...categories.map(toExternalCategoryItem),
      ...manualCategories.map(toManualCategoryItem),
    ],
    [categories, manualCategories]
  );

  const stats = useMemo(() => {
    const totalGames = combinedCategories.reduce(
      (total, category) => total + category.gameCount,
      0
    );
    const totalCategories = combinedCategories.length;

    return {
      activeCount: combinedCategories.filter(
        (category) => normalizeStatus(category.status) === "ACTIVE"
      ).length,
      average:
        totalCategories > 0 ? Math.round(totalGames / totalCategories) : 0,
      totalCategories,
      totalGames,
    };
  }, [combinedCategories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr");
    const filtered = combinedCategories.filter((category) => {
      const searchableText = [
        category.name,
        category.description,
        category.dataSource,
        category.source,
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus =
        status === "all" || normalizeStatus(category.status) === status;
      const matchesMinGames = category.gameCount >= minGames;

      return matchesSearch && matchesStatus && matchesMinGames;
    });

    return [...filtered].sort((leftCategory, rightCategory) => {
      if (sortBy === "name-desc") {
        return rightCategory.name.localeCompare(leftCategory.name, "tr");
      }

      if (sortBy === "games-asc") {
        return leftCategory.gameCount - rightCategory.gameCount;
      }

      if (sortBy === "games-desc") {
        return rightCategory.gameCount - leftCategory.gameCount;
      }

      return leftCategory.name.localeCompare(rightCategory.name, "tr");
    });
  }, [combinedCategories, minGames, search, sortBy, status]);

  const resetFilters = () => {
    clearScheduledSearch();
    setSearch("");
    setStatus("all");
    setSortBy("name-asc");
    setMinGames(0);
    void fetchCategories(source, "");
  };

  const handleSourceChange = (nextSource: GameSource) => {
    clearScheduledSearch();
    setSource(nextSource);
    setStatus("all");
    setMinGames(0);
    void fetchCategories(nextSource, search);
    void fetchManualCategories(nextSource);
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    scheduleCategoryFetch(source, nextSearch);
  };

  const openModal = () => {
    if (!isAdmin) {
      setFormNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setFormNotice(null);
    setFormValue({ ...initialForm, source });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormNotice(null);
    setFormValue(initialForm);
    setCreatingCategory(false);
  };

  const handleCreateCategory = async () => {
    if (!isAdmin) {
      setFormNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    const request: GameCategoryRequest = {
      source: formValue.source,
      name: formValue.name.trim(),
      description: formValue.description?.trim() || null,
    };

    if (!request.name) {
      setFormNotice("Kategori adı zorunludur.");
      return;
    }

    setCreatingCategory(true);
    setFormNotice(null);

    try {
      await createGameCategory(request);
      closeModal();
      setFormNotice("Kategori başarıyla eklendi.");
      setSource(request.source);
      await Promise.all([
        fetchCategories(request.source, search),
        fetchManualCategories(request.source),
      ]);
    } catch (createError) {
      setFormNotice(getCreateErrorMessage(createError));
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Categories" />

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl text-violet-300">
                #
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Kategoriler
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Harici sağlayıcı kategorilerini ve manuel kayıtları görüntüle.
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
                Kategori Ekle
              </button>
            ) : null}
          </section>

          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-4">
              <StatCard
                accent="bg-violet-500/15 text-violet-300"
                helper="Loaded from selected source"
                icon="#"
                label="Total Categories"
                value={String(stats.totalCategories)}
              />
              <StatCard
                accent="bg-cyan-500/15 text-cyan-300"
                helper="Status equals ACTIVE"
                icon="A"
                label="Active Categories"
                value={String(stats.activeCount)}
              />
              <StatCard
                accent="bg-emerald-500/15 text-emerald-300"
                helper="Games across listed categories"
                icon="G"
                label="Total Games"
                value={stats.totalGames.toLocaleString("en")}
              />
              <StatCard
                accent="bg-amber-500/15 text-amber-300"
                helper="Average distribution"
                icon="/"
                label="Avg. Games per Category"
                value={String(stats.average)}
              />
            </div>

            <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl">
              <div className="grid gap-3 xl:grid-cols-[0.8fr_1.4fr_0.8fr_0.7fr_0.8fr_auto_1fr_auto]">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Source
                  </span>
                  <select
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                    onChange={(event) =>
                      handleSourceChange(event.target.value as GameSource)
                    }
                    value={source}
                  >
                    <option value="STEAM">Steam</option>
                    <option value="EPIC">Epic</option>
                  </select>
                </label>

                <label className="relative self-end">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ?
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Search categories..."
                    type="search"
                    value={search}
                  />
                </label>

                <select
                  className="h-12 self-end rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  value={sortBy}
                >
                  <option value="name-asc">Sort by: Name (A-Z)</option>
                  <option value="name-desc">Sort by: Name (Z-A)</option>
                  <option value="games-asc">Games: Low to High</option>
                  <option value="games-desc">Games: High to Low</option>
                </select>

                <select
                  className="h-12 self-end rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) =>
                    setStatus(event.target.value as CategoryStatusFilter)
                  }
                  value={status}
                >
                  <option value="all">Status: All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <select
                  className="h-12 self-end rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setMinGames(Number(event.target.value))}
                  value={minGames}
                >
                  <option value={0}>Min. Games: Any</option>
                  <option value={100}>100+</option>
                  <option value={250}>250+</option>
                  <option value={300}>300+</option>
                </select>

                <button
                  className="h-12 self-end rounded-xl border border-white/10 bg-slate-950/60 px-5 text-sm font-semibold text-slate-300"
                  onClick={resetFilters}
                  type="button"
                >
                  Reset
                </button>

                <div className="flex items-end justify-end pb-3 text-sm text-slate-400">
                  {filteredCategories.length} {sourceLabel(source)} results
                </div>

                <div className="flex h-12 self-end overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-1">
                  <button
                    className={`grid w-16 place-items-center rounded-lg text-xs font-semibold ${
                      viewMode === "grid" ? "bg-violet-600" : "text-slate-400"
                    }`}
                    onClick={() => setViewMode("grid")}
                    type="button"
                  >
                    Grid
                  </button>
                  <button
                    className={`grid w-16 place-items-center rounded-lg text-xs font-semibold ${
                      viewMode === "table" ? "bg-violet-600" : "text-slate-400"
                    }`}
                    onClick={() => setViewMode("table")}
                    type="button"
                  >
                    List
                  </button>
                </div>
              </div>
            </section>

            {!isModalOpen && formNotice ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
                {formNotice}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {manualError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                {manualError}
              </div>
            ) : null}

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 backdrop-blur-xl">
              {loading || manualLoading ? (
                <div className="grid h-96 place-items-center text-sm font-semibold text-slate-300">
                  Loading categories...
                </div>
              ) : null}

              {!loading && !manualLoading && filteredCategories.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      No categories found for selected source.
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {error
                        ? "The provider did not return a category list."
                        : "Try a different source or search query."}
                    </p>
                  </div>
                </div>
              ) : null}

              {!loading && !manualLoading && filteredCategories.length > 0 && viewMode === "table" ? (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4">Total Games</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Data Source</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr
                        className="border-b border-white/10"
                        key={getCategoryKey(category)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <CategoryListImage category={category} />
                            <span className="font-bold text-white">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-md px-5 py-4 text-slate-300">
                          {category.description || "No description provided."}
                        </td>
                        <td className="px-5 py-4 text-slate-200">
                          {category.gameCount}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusBadgeClass(
                              category.status
                            )}`}
                          >
                            {category.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          <div className="flex flex-wrap gap-2">
                            <span>{category.dataSource}</span>
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${
                                category.origin === "external"
                                  ? "border-violet-300/30 bg-violet-500/15 text-violet-100"
                                  : "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                              }`}
                            >
                              {category.origin === "external" ? "Harici" : "Manuel"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            className="rounded-lg px-3 py-1 text-2xl text-slate-300 hover:bg-white/5"
                            type="button"
                          >
                            ...
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {!loading && !manualLoading && filteredCategories.length > 0 && viewMode === "grid" ? (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCategories.map((category) => (
                    <article
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                      key={getCategoryKey(category)}
                    >
                      <CategoryCardImage category={category} />
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-bold text-white">{category.name}</h2>
                          <p className="mt-2 text-sm text-slate-400">
                            {category.description || "No description provided."}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {category.gameCount} oyun - {category.dataSource}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusBadgeClass(
                              category.status
                            )}`}
                          >
                            {category.status}
                          </span>
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                              category.origin === "external"
                                ? "border-violet-300/30 bg-violet-500/15 text-violet-100"
                                : "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                            }`}
                          >
                            {category.origin === "external" ? "Harici" : "Manuel"}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Kategori Ekle
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Steam veya Epic için manuel kategori kaydı oluştur.
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
                handleCreateCategory();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Platform / Sağlayıcı
                </span>
                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                  onChange={(event) =>
                    setFormValue({
                      ...formValue,
                      source: event.target.value as GameSource,
                    })
                  }
                  value={formValue.source}
                >
                  <option value="STEAM">STEAM</option>
                  <option value="EPIC">EPIC</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Kategori adı
                </span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={100}
                  onChange={(event) =>
                    setFormValue({ ...formValue, name: event.target.value })
                  }
                  placeholder="Kategori adını girin"
                  required
                  value={formValue.name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Açıklama</span>
                <textarea
                  className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={500}
                  onChange={(event) =>
                    setFormValue({
                      ...formValue,
                      description: event.target.value,
                    })
                  }
                  placeholder="Kategori açıklamasını girin"
                  value={formValue.description ?? ""}
                />
              </label>

              {formNotice ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                  {formNotice}
                </div>
              ) : null}

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={creatingCategory || !formValue.name.trim()}
                  type="submit"
                >
                  {creatingCategory ? "Kaydediliyor..." : "Kategori Ekle"}
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

export default GameCategoriesPage;
