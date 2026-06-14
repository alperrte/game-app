import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { GamePlatform, GamePlatformRequest } from "../types/gameTypes";

type PlatformStatus = "active" | "inactive";

type PlatformRow = GamePlatform & {
  activeUsers: string;
  developer: string;
  icon: string;
  releaseYear: number;
  status: PlatformStatus;
  totalGames: number;
};

type PlatformForm = {
  description: string;
  developer: string;
  name: string;
  releaseYear: string;
  slug: string;
  status: PlatformStatus;
};

const mockPlatforms: PlatformRow[] = [
  {
    id: 701,
    name: "Steam",
    description: "Steam is a digital distribution platform developed by Valve Corporation.",
    status: "active",
    totalGames: 856,
    activeUsers: "18.5K",
    releaseYear: 2003,
    developer: "Valve Corporation",
    icon: "S",
    createdAt: "2024-05-24T10:42:00",
    updatedAt: "2024-05-24T10:42:00",
  },
  {
    id: 702,
    name: "Epic Games Store",
    description: "PC gaming storefront and launcher from Epic Games.",
    status: "active",
    totalGames: 432,
    activeUsers: "12.1K",
    releaseYear: 2018,
    developer: "Epic Games",
    icon: "E",
    createdAt: "2024-05-11T10:42:00",
    updatedAt: "2024-05-11T10:42:00",
  },
  {
    id: 703,
    name: "PlayStation Store",
    description: "Digital store for PlayStation games and content.",
    status: "active",
    totalGames: 678,
    activeUsers: "15.2K",
    releaseYear: 2006,
    developer: "Sony Interactive Entertainment",
    icon: "P",
    createdAt: "2024-04-21T10:42:00",
    updatedAt: "2024-04-21T10:42:00",
  },
  {
    id: 704,
    name: "Xbox Store",
    description: "Microsoft gaming store for Xbox and Windows titles.",
    status: "active",
    totalGames: 523,
    activeUsers: "11.8K",
    releaseYear: 2013,
    developer: "Microsoft Corporation",
    icon: "X",
    createdAt: "2024-04-08T10:42:00",
    updatedAt: "2024-04-08T10:42:00",
  },
  {
    id: 705,
    name: "GOG.com",
    description: "DRM-free game distribution platform.",
    status: "active",
    totalGames: 2145,
    activeUsers: "3.2K",
    releaseYear: 2008,
    developer: "GOG Limited",
    icon: "G",
    createdAt: "2024-03-19T10:42:00",
    updatedAt: "2024-03-19T10:42:00",
  },
  {
    id: 706,
    name: "Nintendo eShop",
    description: "Digital game store for Nintendo platforms.",
    status: "inactive",
    totalGames: 312,
    activeUsers: "2.1K",
    releaseYear: 2011,
    developer: "Nintendo",
    icon: "N",
    createdAt: "2024-02-28T10:42:00",
    updatedAt: "2024-02-28T10:42:00",
  },
  {
    id: 707,
    name: "Mac App Store",
    description: "Apple storefront for macOS games and apps.",
    status: "active",
    totalGames: 189,
    activeUsers: "1.6K",
    releaseYear: 2011,
    developer: "Apple Inc.",
    icon: "A",
    createdAt: "2024-02-11T10:42:00",
    updatedAt: "2024-02-11T10:42:00",
  },
  {
    id: 708,
    name: "Google Play Games",
    description: "Google platform for Android and PC game access.",
    status: "active",
    totalGames: 245,
    activeUsers: "4.3K",
    releaseYear: 2013,
    developer: "Google LLC",
    icon: "G",
    createdAt: "2024-01-22T10:42:00",
    updatedAt: "2024-01-22T10:42:00",
  },
];

const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const mapBackendPlatform = (
  platform: GamePlatform,
  index: number
): PlatformRow => {
  const mockPlatform = mockPlatforms[index % mockPlatforms.length];

  return {
    ...platform,
    description: platform.description ?? "No description provided.",
    status: index % 7 === 0 ? "inactive" : "active",
    totalGames: 120 + ((platform.id * 31 + index * 19) % 900),
    activeUsers: `${(1 + ((platform.id + index) % 24)).toFixed(1)}K`,
    releaseYear: mockPlatform.releaseYear,
    developer: mockPlatform.developer,
    icon: platform.name.charAt(0).toUpperCase(),
  };
};

const mapPlatformToForm = (platform: PlatformRow): PlatformForm => {
  return {
    name: platform.name,
    slug: createSlug(platform.name),
    description: platform.description ?? "",
    developer: platform.developer,
    releaseYear: String(platform.releaseYear),
    status: platform.status,
  };
};

const statusBadgeClass = (status: PlatformStatus) => {
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

const emptyForm: PlatformForm = {
  name: "",
  slug: "",
  description: "",
  developer: "",
  releaseYear: "",
  status: "active",
};

const GamePlatformsPage = () => {
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformRow | null>(
    null
  );
  const [formValue, setFormValue] = useState<PlatformForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlatformStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    gameService
      .getPlatforms()
      .then((backendPlatforms) => {
        if (!active) {
          return;
        }

        const nextPlatforms =
          backendPlatforms.length > 0
            ? backendPlatforms.map(mapBackendPlatform)
            : mockPlatforms;

        setPlatforms(nextPlatforms);
        setSelectedPlatform(nextPlatforms[0] ?? null);
        setFormValue(nextPlatforms[0] ? mapPlatformToForm(nextPlatforms[0]) : emptyForm);
        setNotice(
          backendPlatforms.length > 0
            ? null
            : "Backend returned no platforms, showing mock data."
        );
      })
      .catch(() => {
        if (active) {
          setPlatforms(mockPlatforms);
          setSelectedPlatform(mockPlatforms[0]);
          setFormValue(mapPlatformToForm(mockPlatforms[0]));
          setNotice("Backend is unavailable, showing mock platform data.");
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
    const activePlatforms = platforms.filter(
      (platform) => platform.status === "active"
    ).length;
    const totalGames = platforms.reduce(
      (total, platform) => total + platform.totalGames,
      0
    );
    const totalUsers = platforms.reduce((total, platform) => {
      return total + Number(platform.activeUsers.replace("K", ""));
    }, 0);

    return {
      activePlatforms,
      totalGames,
      totalPlatforms: platforms.length,
      totalUsers: `${totalUsers.toFixed(1)}K`,
    };
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return platforms.filter((platform) => {
      const matchesSearch =
        !normalizedSearch ||
        `${platform.name} ${platform.developer}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || platform.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [platforms, search, statusFilter]);

  const selectPlatform = (platform: PlatformRow) => {
    setSelectedPlatform(platform);
    setFormValue(mapPlatformToForm(platform));
    setNotice(null);
  };

  const addPlatform = () => {
    setSelectedPlatform(null);
    setFormValue(emptyForm);
    setNotice("Fill the details panel to create a new platform.");
  };

  const savePlatform = async () => {
    const request: GamePlatformRequest = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || null,
    };

    if (!request.name) {
      setNotice("Platform name is required.");
      return;
    }

    setSaving(true);

    try {
      if (selectedPlatform) {
        const updatedPlatform = await gameService.updatePlatform(
          selectedPlatform.id,
          request
        );
        const nextPlatform: PlatformRow = {
          ...selectedPlatform,
          ...updatedPlatform,
          description: updatedPlatform.description ?? request.description ?? null,
          developer: formValue.developer,
          releaseYear: Number(formValue.releaseYear) || selectedPlatform.releaseYear,
          status: formValue.status,
        };
        setPlatforms((currentPlatforms) =>
          currentPlatforms.map((platform) =>
            platform.id === nextPlatform.id ? nextPlatform : platform
          )
        );
        setSelectedPlatform(nextPlatform);
        setNotice("Platform updated successfully.");
      } else {
        const createdPlatform = await gameService.createPlatform(request);
        const nextPlatform: PlatformRow = {
          ...createdPlatform,
          description: createdPlatform.description ?? request.description ?? null,
          activeUsers: "0.0K",
          developer: formValue.developer || "Unknown Developer",
          icon: createdPlatform.name.charAt(0).toUpperCase(),
          releaseYear: Number(formValue.releaseYear) || new Date().getFullYear(),
          status: formValue.status,
          totalGames: 0,
        };
        setPlatforms((currentPlatforms) => [nextPlatform, ...currentPlatforms]);
        setSelectedPlatform(nextPlatform);
        setNotice("Platform created successfully.");
      }
    } catch {
      setNotice("Backend save failed. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Platforms" />

        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Game Platforms
              </h1>
              <p className="mt-2 text-base text-slate-400">
                Manage platforms and their details
              </p>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              onClick={addPlatform}
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Platform
            </button>
          </section>

          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="All platforms"
              icon="♘"
              label="Total Platforms"
              value={String(stats.totalPlatforms)}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="Currently supported"
              icon="◇"
              label="Active Platforms"
              value={String(stats.activePlatforms)}
            />
            <StatCard
              accent="bg-sky-500/15 text-sky-300"
              helper="Across all platforms"
              icon="▤"
              label="Total Games"
              value={stats.totalGames.toLocaleString("en")}
            />
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Platform users"
              icon="♙"
              label="Total Users"
              value={stats.totalUsers}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_580px]">
            <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-5 grid gap-4 md:grid-cols-[1fr_240px]">
                <label className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ⌕
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search platforms..."
                    value={search}
                  />
                </label>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | PlatformStatus)
                  }
                  value={statusFilter}
                >
                  <option value="all">Filter by Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {notice ? (
                <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                  {notice}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-white/10">
                {loading ? (
                  <div className="h-96 animate-pulse bg-slate-900/70" />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 bg-slate-900/30 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4">Platform</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Total Games</th>
                        <th className="px-5 py-4">Active Users</th>
                        <th className="px-5 py-4">Release Year</th>
                        <th className="px-5 py-4">Developer</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlatforms.map((platform) => (
                        <tr
                          className="border-b border-white/10 hover:bg-white/[0.03]"
                          key={platform.id}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-700 text-lg font-black text-white">
                                {platform.icon}
                              </div>
                              <span className="font-bold text-white">
                                {platform.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                                platform.status
                              )}`}
                            >
                              {platform.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {platform.totalGames.toLocaleString("en")}
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {platform.activeUsers}
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {platform.releaseYear}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {platform.developer}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                className="grid h-10 w-10 place-items-center rounded-lg border border-violet-400/30 text-violet-300"
                                onClick={() => selectPlatform(platform)}
                                type="button"
                              >
                                ✎
                              </button>
                              <button
                                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300"
                                type="button"
                              >
                                ⋯
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white">Platform Details</h2>

              <div className="mt-6 flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-700 text-3xl font-black text-white">
                  {(
                    selectedPlatform?.icon ??
                    (formValue.name.charAt(0) || "P")
                  ).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">
                      {formValue.name || "New Platform"}
                    </h3>
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                        formValue.status
                      )}`}
                    >
                      {formValue.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    PC Gaming Platform
                  </p>
                  <p className="text-xs text-slate-500">
                    Created on May 24, 2024
                  </p>
                </div>
              </div>

              <div className="mt-7 flex gap-8 border-b border-white/10">
                {["Overview", "Statistics", "Settings"].map((tab, index) => (
                  <button
                    className={`pb-3 text-sm font-bold ${
                      index === 0
                        ? "border-b-2 border-violet-500 text-white"
                        : "text-slate-400"
                    }`}
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form
                className="mt-6 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void savePlatform();
                }}
              >
                <label className="grid gap-2">
                  <span className="text-sm text-slate-400">Platform Name</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={100}
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        name: event.target.value,
                        slug: createSlug(event.target.value),
                      })
                    }
                    value={formValue.name}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-400">Slug</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({ ...formValue, slug: event.target.value })
                    }
                    value={formValue.slug}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-400">Description</span>
                  <textarea
                    className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        description: event.target.value,
                      })
                    }
                    value={formValue.description}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-400">Developer</span>
                    <input
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setFormValue({
                          ...formValue,
                          developer: event.target.value,
                        })
                      }
                      value={formValue.developer}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-slate-400">Release Year</span>
                    <input
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setFormValue({
                          ...formValue,
                          releaseYear: event.target.value,
                        })
                      }
                      value={formValue.releaseYear}
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-400">Status</span>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        status: event.target.value as PlatformStatus,
                      })
                    }
                    value={formValue.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-6 text-sm font-bold text-white"
                    onClick={() => {
                      if (selectedPlatform) {
                        setFormValue(mapPlatformToForm(selectedPlatform));
                      } else {
                        setFormValue(emptyForm);
                      }
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? "Saving..." : "Save Changes"}
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

export default GamePlatformsPage;
