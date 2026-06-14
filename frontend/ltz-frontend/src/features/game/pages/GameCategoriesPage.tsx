import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { GameCategory, GameCategoryRequest } from "../types/gameTypes";

type CategoryStatus = "active" | "inactive";
type CategoryViewMode = "grid" | "table";

type CategoryRow = GameCategory & {
  iconUrl: string;
  status: CategoryStatus;
  totalGames: number;
};

type CategoryForm = {
  description: string;
  iconUrl: string;
  name: string;
  status: CategoryStatus;
};

const mockCategories: CategoryRow[] = [
  {
    id: 501,
    name: "Cybernetica",
    description: "Cyberpunk and futuristic games set in high-tech worlds.",
    totalGames: 284,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-06-02T10:42:00",
    updatedAt: "2024-06-02T10:42:00",
  },
  {
    id: 502,
    name: "Action RPG",
    description: "Action role-playing games with character progression and story.",
    totalGames: 412,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-05-24T10:42:00",
    updatedAt: "2024-05-24T10:42:00",
  },
  {
    id: 503,
    name: "Adventure",
    description: "Story-driven games focused on exploration and puzzle solving.",
    totalGames: 356,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-04-10T10:42:00",
    updatedAt: "2024-04-10T10:42:00",
  },
  {
    id: 504,
    name: "Survival",
    description: "Games focused on survival, crafting, and resource management.",
    totalGames: 298,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-03-18T10:42:00",
    updatedAt: "2024-03-18T10:42:00",
  },
  {
    id: 505,
    name: "Racing",
    description: "High-speed racing games and driving simulations.",
    totalGames: 189,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-05-05T10:42:00",
    updatedAt: "2024-05-05T10:42:00",
  },
  {
    id: 506,
    name: "Strategy",
    description: "Strategic thinking and tactical gameplay experiences.",
    totalGames: 267,
    status: "inactive",
    iconUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-02-14T10:42:00",
    updatedAt: "2024-02-14T10:42:00",
  },
  {
    id: 507,
    name: "Fantasy",
    description: "Fantasy-themed games with magical elements and mythical worlds.",
    totalGames: 324,
    status: "active",
    iconUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80",
    createdAt: "2024-01-30T10:42:00",
    updatedAt: "2024-01-30T10:42:00",
  },
];

const initialForm: CategoryForm = {
  name: "",
  description: "",
  iconUrl: "",
  status: "active",
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const mapBackendCategory = (
  category: GameCategory,
  index: number
): CategoryRow => {
  return {
    ...category,
    description: category.description ?? "No description provided.",
    totalGames: 80 + ((category.id * 37 + index * 23) % 420),
    status: index % 6 === 0 ? "inactive" : "active",
    iconUrl: mockCategories[index % mockCategories.length].iconUrl,
  };
};

const statusBadgeClass = (status: CategoryStatus) => {
  return status === "active"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-red-400/20 bg-red-500/15 text-red-200";
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
          className={`grid h-16 w-16 place-items-center rounded-2xl text-4xl ${accent}`}
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

const GameCategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | CategoryStatus>("all");
  const [minGames, setMinGames] = useState(0);
  const [viewMode, setViewMode] = useState<CategoryViewMode>("table");
  const [formValue, setFormValue] = useState<CategoryForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    gameService
      .getCategories()
      .then((backendCategories) => {
        if (!active) {
          return;
        }

        if (backendCategories.length === 0) {
          setCategories(mockCategories);
          setNotice("Backend returned no categories, showing mock data.");
          return;
        }

        setCategories(backendCategories.map(mapBackendCategory));
      })
      .catch(() => {
        if (active) {
          setCategories(mockCategories);
          setNotice("Backend is unavailable, showing mock category data.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeCount = categories.filter(
      (category) => category.status === "active"
    ).length;
    const totalGames = categories.reduce(
      (total, category) => total + category.totalGames,
      0
    );
    const average =
      categories.length > 0 ? Math.round(totalGames / categories.length) : 0;

    return {
      activeCount,
      average,
      totalCategories: categories.length,
      totalGames,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          !normalizedSearch ||
          `${category.name} ${category.description}`
            .toLowerCase()
            .includes(normalizedSearch);
        const matchesStatus = status === "all" || category.status === status;
        const matchesMinGames = category.totalGames >= minGames;

        return matchesSearch && matchesStatus && matchesMinGames;
      })
      .sort((leftCategory, rightCategory) =>
        leftCategory.name.localeCompare(rightCategory.name)
      );
  }, [categories, minGames, search, status]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setMinGames(0);
  };

  const createCategory = async () => {
    const request: GameCategoryRequest = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || null,
    };

    if (!request.name) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const createdCategory = await gameService.createCategory(request);
      setCategories((currentCategories) => [
        {
          ...createdCategory,
          description: createdCategory.description ?? request.description ?? null,
          iconUrl: formValue.iconUrl || mockCategories[0].iconUrl,
          status: formValue.status,
          totalGames: 0,
        },
        ...currentCategories,
      ]);
      setFormValue(initialForm);
      setNotice("Category created successfully.");
    } catch {
      const mockCreatedCategory: CategoryRow = {
        id: Date.now(),
        name: request.name,
        description: request.description ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        iconUrl: formValue.iconUrl || mockCategories[0].iconUrl,
        status: formValue.status,
        totalGames: 0,
      };
      setCategories((currentCategories) => [
        mockCreatedCategory,
        ...currentCategories,
      ]);
      setFormValue(initialForm);
      setNotice("Backend create failed, category added locally as mock data.");
    } finally {
      setSubmitting(false);
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
                ▦
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Game Categories
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Manage and organize game categories to help users discover
                  games.
                </p>
              </div>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              onClick={() => {
                document.getElementById("category-name")?.focus();
              }}
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add New Category
            </button>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <StatCard
                  accent="bg-violet-500/15 text-violet-300"
                  helper="All categories in the system"
                  icon="▦"
                  label="Total Categories"
                  value={String(stats.totalCategories)}
                />
                <StatCard
                  accent="bg-cyan-500/15 text-cyan-300"
                  helper="Currently active categories"
                  icon="♘"
                  label="Active Categories"
                  value={String(stats.activeCount)}
                />
                <StatCard
                  accent="bg-emerald-500/15 text-emerald-300"
                  helper="Games across all categories"
                  icon="◎"
                  label="Total Games"
                  value={stats.totalGames.toLocaleString("en")}
                />
                <StatCard
                  accent="bg-amber-500/15 text-amber-300"
                  helper="Average distribution"
                  icon="↗"
                  label="Avg. Games per Category"
                  value={String(stats.average)}
                />
              </div>

              <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl">
                <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.7fr_0.8fr_auto_1fr_auto]">
                  <label className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                      ⌕
                    </span>
                    <input
                      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search categories..."
                      value={search}
                    />
                  </label>

                  <select className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none">
                    <option>Sort by: Name (A-Z)</option>
                  </select>

                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                    onChange={(event) =>
                      setStatus(event.target.value as "all" | CategoryStatus)
                    }
                    value={status}
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                    onChange={(event) => setMinGames(Number(event.target.value))}
                    value={minGames}
                  >
                    <option value={0}>Min. Games: Any</option>
                    <option value={100}>100+</option>
                    <option value={250}>250+</option>
                    <option value={300}>300+</option>
                  </select>

                  <button
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-5 text-sm font-semibold text-slate-300"
                    onClick={resetFilters}
                    type="button"
                  >
                    Reset
                  </button>

                  <div className="flex items-center justify-end text-sm text-slate-400">
                    {filteredCategories.length} results
                  </div>

                  <div className="flex h-12 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-1">
                    <button
                      className={`grid w-12 place-items-center rounded-lg ${
                        viewMode === "grid" ? "bg-violet-600" : "text-slate-400"
                      }`}
                      onClick={() => setViewMode("grid")}
                      type="button"
                    >
                      ▦
                    </button>
                    <button
                      className={`grid w-12 place-items-center rounded-lg ${
                        viewMode === "table" ? "bg-violet-600" : "text-slate-400"
                      }`}
                      onClick={() => setViewMode("table")}
                      type="button"
                    >
                      ☰
                    </button>
                  </div>
                </div>
              </section>

              {notice ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 backdrop-blur-xl">
                {loading ? (
                  <div className="h-96 animate-pulse bg-slate-900/70" />
                ) : null}

                {!loading && viewMode === "table" ? (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Description</th>
                        <th className="px-5 py-4">Total Games</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Created At</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category, index) => (
                        <tr
                          className={`border-b border-white/10 ${
                            index === 0 ? "outline outline-1 outline-violet-500" : ""
                          }`}
                          key={category.id}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <img
                                alt={category.name}
                                className="h-14 w-16 rounded-lg object-cover"
                                src={category.iconUrl}
                              />
                              <span className="font-bold text-white">
                                {category.name}
                              </span>
                            </div>
                          </td>
                          <td className="max-w-md px-5 py-4 text-slate-300">
                            {category.description}
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {category.totalGames}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                                category.status
                              )}`}
                            >
                              {category.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatDate(category.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              className="rounded-lg px-3 py-1 text-2xl text-slate-300 hover:bg-white/5"
                              type="button"
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {!loading && viewMode === "grid" ? (
                  <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCategories.map((category) => (
                      <article
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                        key={category.id}
                      >
                        <img
                          alt={category.name}
                          className="h-32 w-full rounded-xl object-cover"
                          src={category.iconUrl}
                        />
                        <div className="mt-4 flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-bold text-white">{category.name}</h2>
                            <p className="mt-2 text-sm text-slate-400">
                              {category.description}
                            </p>
                          </div>
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                              category.status
                            )}`}
                          >
                            {category.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Add New Category
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Create a new game category to organize games and help users
                    discover content.
                  </p>
                </div>
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-xl text-slate-400"
                  onClick={() => setFormValue(initialForm)}
                  type="button"
                >
                  ×
                </button>
              </div>

              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createCategory();
                }}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Category Name
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    id="category-name"
                    maxLength={100}
                    onChange={(event) =>
                      setFormValue({ ...formValue, name: event.target.value })
                    }
                    placeholder="Enter category name..."
                    value={formValue.name}
                  />
                  <span className="text-xs text-slate-500">
                    Choose a clear, descriptive name for the category.
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Description</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        description: event.target.value,
                      })
                    }
                    placeholder="Describe this category..."
                    value={formValue.description}
                  />
                  <span className="text-xs text-slate-500">
                    Explain what types of games belong in this category.
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Category Icon
                  </span>
                  <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-violet-400/50 bg-violet-500/5 p-5 text-center">
                    <div>
                      <div className="text-4xl text-violet-300">↥</div>
                      <div className="mt-2 font-bold text-violet-100">
                        Upload Icon
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        PNG, JPG or SVG (512x512)
                      </div>
                    </div>
                  </div>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({ ...formValue, iconUrl: event.target.value })
                    }
                    placeholder="Optional icon URL"
                    value={formValue.iconUrl}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Status</span>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        status: event.target.value as CategoryStatus,
                      })
                    }
                    value={formValue.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <span className="text-xs text-slate-500">
                    Set the initial status for this category.
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "Creating..." : "Create Category"}
                  </button>
                  <button
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white"
                    onClick={() => setFormValue(initialForm)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameCategoriesPage;
