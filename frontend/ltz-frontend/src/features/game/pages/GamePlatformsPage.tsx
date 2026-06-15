import { useEffect, useMemo, useState } from "react";

import GameNavbar from "../components/GameNavbar";
import { getExternalGamePlatforms } from "../services/externalGameService";
import type { ExternalGamePlatform } from "../types/externalGame.types";
import { getErrorMessage } from "../../../utils/getErrorMessage";

type PlatformStatusFilter = "all" | "ACTIVE" | "INACTIVE";

type PlatformForm = {
  description: string;
  developer: string;
  logoUrl: string;
  name: string;
  releaseYear: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyForm: PlatformForm = {
  name: "",
  slug: "",
  description: "",
  developer: "",
  releaseYear: "",
  status: "ACTIVE",
  logoUrl: "",
};

const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const normalizeStatus = (status: string) => status.trim().toUpperCase();

const statusBadgeClass = (status: string) => {
  return normalizeStatus(status) === "ACTIVE"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-red-400/20 bg-red-500/15 text-red-200";
};

const formatActiveUsers = (activeUsers: string | null) => {
  return activeUsers?.trim() || "N/A";
};

const platformInitial = (platform: ExternalGamePlatform) => {
  return platform.name.trim().charAt(0).toUpperCase() || platform.source.charAt(0);
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

const PlatformAvatar = ({ platform }: { platform: ExternalGamePlatform }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = platform.logoUrl?.trim();
  const shouldShowLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <div className="h-11 w-11 overflow-hidden rounded-full border border-violet-400/20 bg-gradient-to-br from-sky-500 to-violet-700">
      {shouldShowLogo ? (
        <img
          alt={platform.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setLogoFailed(true)}
          src={logoUrl}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-lg font-black text-white">
          {platformInitial(platform)}
        </div>
      )}
    </div>
  );
};

const GamePlatformsPage = () => {
  const [platforms, setPlatforms] = useState<ExternalGamePlatform[]>([]);
  const [formValue, setFormValue] = useState<PlatformForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PlatformStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlatforms = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await getExternalGamePlatforms();
      setPlatforms(results);
    } catch (platformError) {
      console.error("External platforms could not be loaded.", platformError);
      setPlatforms([]);
      setError(
        getErrorMessage(
          platformError,
          "Platforms could not be loaded from external providers."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoadTimeout = window.setTimeout(() => {
      void fetchPlatforms();
    }, 0);

    return () => window.clearTimeout(initialLoadTimeout);
  }, []);

  const stats = useMemo(() => {
    const totalGames = platforms.reduce(
      (total, platform) => total + platform.totalGames,
      0
    );

    return {
      activePlatforms: platforms.filter(
        (platform) => normalizeStatus(platform.status) === "ACTIVE"
      ).length,
      totalGames,
      totalPlatforms: platforms.length,
      totalUsers: "N/A",
    };
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return platforms.filter((platform) => {
      const searchableText = [
        platform.name,
        platform.source,
        platform.developer,
        platform.description,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(platform.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [platforms, search, statusFilter]);

  const openModal = () => {
    setFormValue(emptyForm);
    setFormNotice(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormNotice(null);
    setFormValue(emptyForm);
  };

  const showActionNotice = (message: string) => {
    setNotice(message);
  };

  const handleCreatePlatform = () => {
    setFormNotice("Platform oluşturma işlemi henüz backend'e bağlı değil.");
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
                Browse external provider platforms through the API Gateway.
              </p>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              onClick={openModal}
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Platform
            </button>
          </section>

          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Loaded from external providers"
              icon="P"
              label="Total Platforms"
              value={String(stats.totalPlatforms)}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="Status equals ACTIVE"
              icon="A"
              label="Active Platforms"
              value={String(stats.activePlatforms)}
            />
            <StatCard
              accent="bg-sky-500/15 text-sky-300"
              helper="Across listed platforms"
              icon="G"
              label="Total Games"
              value={stats.totalGames.toLocaleString("en")}
            />
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Provider user count unavailable"
              icon="U"
              label="Total Users"
              value={stats.totalUsers}
            />
          </div>

          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mb-5 grid gap-4 md:grid-cols-[1fr_240px]">
              <label className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                  ?
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search platforms..."
                  type="search"
                  value={search}
                />
              </label>

              <select
                className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                onChange={(event) =>
                  setStatusFilter(event.target.value as PlatformStatusFilter)
                }
                value={statusFilter}
              >
                <option value="all">Filter by Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {notice ? (
              <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-white/10">
              {loading ? (
                <div className="grid h-96 place-items-center text-sm font-semibold text-slate-300">
                  Loading platforms...
                </div>
              ) : null}

              {!loading && filteredPlatforms.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      No platforms found.
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {error
                        ? "The provider endpoint did not return a platform list."
                        : "Try a different search or status filter."}
                    </p>
                  </div>
                </div>
              ) : null}

              {!loading && filteredPlatforms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-slate-900/30 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4">Platform</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Total Games</th>
                        <th className="px-5 py-4">Active Users</th>
                        <th className="px-5 py-4">Release Year</th>
                        <th className="px-5 py-4">Developer</th>
                        <th className="px-5 py-4">Data Source</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlatforms.map((platform) => (
                        <tr
                          className="border-b border-white/10 hover:bg-white/[0.03]"
                          key={platform.source}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <PlatformAvatar platform={platform} />
                              <div>
                                <span className="font-bold text-white">
                                  {platform.name}
                                </span>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {platform.source}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusBadgeClass(
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
                            {formatActiveUsers(platform.activeUsers)}
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {platform.releaseYear}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {platform.developer}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {platform.dataSource}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                className="grid h-10 w-10 place-items-center rounded-lg border border-violet-400/30 text-xs font-bold text-violet-300"
                                onClick={() =>
                                  showActionNotice(
                                    "Platform düzenleme işlemi henüz backend'e bağlı değil."
                                  )
                                }
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-xl text-slate-300"
                                onClick={() =>
                                  showActionNotice(
                                    "Platform aksiyonları henüz backend'e bağlı değil."
                                  )
                                }
                                type="button"
                              >
                                ...
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Add Platform</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Manual platform creation UI is prepared, but the create
                  endpoint is not connected yet.
                </p>
              </div>
              <button
                aria-label="Close modal"
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-xl text-slate-400 hover:bg-white/10"
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
                handleCreatePlatform();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Platform Name
                </span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={100}
                  onChange={(event) =>
                    setFormValue({
                      ...formValue,
                      name: event.target.value,
                      slug: createSlug(event.target.value),
                    })
                  }
                  placeholder="Enter platform name..."
                  value={formValue.name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Slug</span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  onChange={(event) =>
                    setFormValue({ ...formValue, slug: event.target.value })
                  }
                  placeholder="platform-slug"
                  value={formValue.slug}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Description</span>
                <textarea
                  className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={500}
                  onChange={(event) =>
                    setFormValue({
                      ...formValue,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe this platform..."
                  value={formValue.description}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Developer</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        developer: event.target.value,
                      })
                    }
                    placeholder="Developer..."
                    value={formValue.developer}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Release Year
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    inputMode="numeric"
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        releaseYear: event.target.value,
                      })
                    }
                    placeholder="2003"
                    value={formValue.releaseYear}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Status</span>
                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                  onChange={(event) =>
                    setFormValue({
                      ...formValue,
                      status: event.target.value as PlatformForm["status"],
                    })
                  }
                  value={formValue.status}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Logo URL</span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  onChange={(event) =>
                    setFormValue({ ...formValue, logoUrl: event.target.value })
                  }
                  placeholder="Optional logo URL"
                  value={formValue.logoUrl}
                />
              </label>

              {formNotice ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                  {formNotice}
                </div>
              ) : null}

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50"
                  type="submit"
                >
                  Create Platform
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default GamePlatformsPage;
