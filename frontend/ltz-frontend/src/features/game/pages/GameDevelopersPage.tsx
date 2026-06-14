import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { GameDeveloper } from "../types/gameTypes";

type DeveloperStatus = "active" | "inactive";
type DeveloperViewMode = "grid" | "list";

type DeveloperRow = GameDeveloper & {
  about: string;
  activeUsers: string;
  email: string;
  featured: boolean;
  featuredTitles: string[];
  focus: string[];
  founded: number;
  games: number;
  logo: string;
  status: DeveloperStatus;
  teamSize: string;
};

const titleImages = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=180&q=80",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=180&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=180&q=80",
];

const mockDevelopers: DeveloperRow[] = [
  {
    id: 801,
    name: "Nebula Forge",
    description: "Crafting immersive worlds.",
    country: "United States",
    websiteUrl: "https://nebulaforge.games",
    email: "contact@nebulaforge.games",
    founded: 2016,
    games: 12,
    activeUsers: "18.5K",
    featured: true,
    status: "active",
    teamSize: "25 - 50",
    logo: "NF",
    focus: ["RPG", "Sci-Fi", "Adventure", "Open World", "Story Rich"],
    featuredTitles: titleImages,
    about:
      "Nebula Forge is an independent studio dedicated to creating deep, narrative-driven experiences in vast and immersive worlds.",
    createdAt: "2024-06-02T10:42:00",
    updatedAt: "2024-06-02T10:42:00",
  },
  {
    id: 802,
    name: "Mythic Owl",
    description: "Stories that live forever.",
    country: "United Kingdom",
    websiteUrl: "https://mythicowl.games",
    email: "hello@mythicowl.games",
    founded: 2014,
    games: 9,
    activeUsers: "9.4K",
    featured: true,
    status: "active",
    teamSize: "10 - 25",
    logo: "MO",
    focus: ["Adventure", "Fantasy", "Puzzle"],
    featuredTitles: titleImages,
    about:
      "Mythic Owl builds story-first adventures with handcrafted worlds and memorable characters.",
    createdAt: "2024-05-24T10:42:00",
    updatedAt: "2024-05-24T10:42:00",
  },
  {
    id: 803,
    name: "Iron Harbor",
    description: "Bold games. Real impact.",
    country: "Canada",
    websiteUrl: "https://ironharbor.dev",
    email: "team@ironharbor.dev",
    founded: 2018,
    games: 7,
    activeUsers: "6.1K",
    featured: false,
    status: "active",
    teamSize: "25 - 50",
    logo: "IH",
    focus: ["Action", "Co-op", "Simulation"],
    featuredTitles: titleImages,
    about:
      "Iron Harbor focuses on bold cooperative games with strong systems and replayable loops.",
    createdAt: "2024-04-10T10:42:00",
    updatedAt: "2024-04-10T10:42:00",
  },
  {
    id: 804,
    name: "Pixel Hearth",
    description: "Retro soul. Modern games.",
    country: "Japan",
    websiteUrl: "https://pixelhearth.jp",
    email: "contact@pixelhearth.jp",
    founded: 2017,
    games: 14,
    activeUsers: "14.2K",
    featured: false,
    status: "active",
    teamSize: "10 - 25",
    logo: "PH",
    focus: ["Indie", "Pixel Art", "RPG"],
    featuredTitles: titleImages,
    about:
      "Pixel Hearth creates modern indie games with retro presentation and polished mechanics.",
    createdAt: "2024-03-18T10:42:00",
    updatedAt: "2024-03-18T10:42:00",
  },
  {
    id: 805,
    name: "Driftline Studio",
    description: "Speed. Style. Freedom.",
    country: "Germany",
    websiteUrl: "https://driftline.studio",
    email: "hello@driftline.studio",
    founded: 2020,
    games: 6,
    activeUsers: "4.8K",
    featured: false,
    status: "inactive",
    teamSize: "5 - 10",
    logo: "DS",
    focus: ["Racing", "Arcade", "Sports"],
    featuredTitles: titleImages,
    about:
      "Driftline Studio designs fast, stylish racing games with accessible controls and deep mastery.",
    createdAt: "2024-02-14T10:42:00",
    updatedAt: "2024-02-14T10:42:00",
  },
];

const mapBackendDeveloper = (
  developer: GameDeveloper,
  index: number
): DeveloperRow => {
  const mockDeveloper = mockDevelopers[index % mockDevelopers.length];

  return {
    ...developer,
    description: developer.description ?? "No studio description provided.",
    country: developer.country ?? mockDeveloper.country,
    websiteUrl: developer.websiteUrl ?? mockDeveloper.websiteUrl,
    about: developer.description ?? mockDeveloper.about,
    activeUsers: mockDeveloper.activeUsers,
    email: `contact@${developer.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.games`,
    featured: index % 3 === 0,
    featuredTitles: mockDeveloper.featuredTitles,
    focus: mockDeveloper.focus,
    founded: mockDeveloper.founded,
    games: mockDeveloper.games + index,
    logo: developer.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    status: index % 7 === 0 ? "inactive" : "active",
    teamSize: mockDeveloper.teamSize,
  };
};

const badgeClass = (status: DeveloperStatus) => {
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

const GameDevelopersPage = () => {
  const [developers, setDevelopers] = useState<DeveloperRow[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] =
    useState<DeveloperRow | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [genre, setGenre] = useState("all");
  const [status, setStatus] = useState<"all" | DeveloperStatus>("all");
  const [viewMode, setViewMode] = useState<DeveloperViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    gameService
      .getDevelopers()
      .then((backendDevelopers) => {
        if (!active) {
          return;
        }

        const nextDevelopers =
          backendDevelopers.length > 0
            ? backendDevelopers.map(mapBackendDeveloper)
            : mockDevelopers;

        setDevelopers(nextDevelopers);
        setSelectedDeveloper(nextDevelopers[0] ?? null);
        setNotice(
          backendDevelopers.length > 0
            ? null
            : "Backend returned no developers, showing mock data."
        );
      })
      .catch(() => {
        if (active) {
          setDevelopers(mockDevelopers);
          setSelectedDeveloper(mockDevelopers[0]);
          setNotice("Backend is unavailable, showing mock developer data.");
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

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        developers
          .map((developer) => developer.country)
          .filter((nextCountry): nextCountry is string => Boolean(nextCountry))
      )
    ).sort();
  }, [developers]);

  const genres = useMemo(() => {
    return Array.from(new Set(developers.flatMap((developer) => developer.focus))).sort();
  }, [developers]);

  const stats = useMemo(() => {
    const totalGames = developers.reduce(
      (total, developer) => total + developer.games,
      0
    );
    const featuredDevelopers = developers.filter(
      (developer) => developer.featured
    ).length;
    const countriesRepresented = new Set(
      developers.map((developer) => developer.country)
    ).size;

    return {
      countriesRepresented,
      featuredDevelopers,
      totalDevelopers: developers.length,
      totalGames,
    };
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return developers
      .filter((developer) => {
        const matchesSearch =
          !normalizedSearch ||
          `${developer.name} ${developer.description} ${developer.country}`
            .toLowerCase()
            .includes(normalizedSearch);
        const matchesCountry = country === "all" || developer.country === country;
        const matchesGenre = genre === "all" || developer.focus.includes(genre);
        const matchesStatus = status === "all" || developer.status === status;

        return matchesSearch && matchesCountry && matchesGenre && matchesStatus;
      })
      .sort((leftDeveloper, rightDeveloper) =>
        rightDeveloper.createdAt.localeCompare(leftDeveloper.createdAt)
      );
  }, [country, developers, genre, search, status]);

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Developers" />

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                ♙
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Game Developers
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Manage and discover game development studios on the
                  LobbyTwoZero platform.
                </p>
              </div>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Developer
            </button>
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-sky-500/15 text-sky-300"
              helper="12 this month"
              icon="♙"
              label="Total Developers"
              value={String(stats.totalDevelopers)}
            />
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="24 this month"
              icon="♘"
              label="Total Games"
              value={String(stats.totalGames)}
            />
            <StatCard
              accent="bg-amber-500/15 text-amber-300"
              helper="Top performing"
              icon="☆"
              label="Featured Developers"
              value={String(stats.featuredDevelopers)}
            />
            <StatCard
              accent="bg-cyan-500/15 text-cyan-300"
              helper="Worldwide"
              icon="◎"
              label="Countries Represented"
              value={String(stats.countriesRepresented)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_470px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_1fr_auto]">
                <label className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ⌕
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search developers..."
                    value={search}
                  />
                </label>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setCountry(event.target.value)}
                  value={country}
                >
                  <option value="all">All Countries</option>
                  {countries.map((nextCountry) => (
                    <option key={nextCountry} value={nextCountry}>
                      {nextCountry}
                    </option>
                  ))}
                </select>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setGenre(event.target.value)}
                  value={genre}
                >
                  <option value="all">All Genres</option>
                  {genres.map((nextGenre) => (
                    <option key={nextGenre} value={nextGenre}>
                      {nextGenre}
                    </option>
                  ))}
                </select>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) =>
                    setStatus(event.target.value as "all" | DeveloperStatus)
                  }
                  value={status}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none">
                  <option>Sort by: Newest First</option>
                </select>

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
                      viewMode === "list" ? "bg-violet-600" : "text-slate-400"
                    }`}
                    onClick={() => setViewMode("list")}
                    type="button"
                  >
                    ☰
                  </button>
                </div>
              </div>

              {notice ? (
                <div className="m-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                  {notice}
                </div>
              ) : null}

              {loading ? (
                <div className="h-96 animate-pulse bg-slate-900/70" />
              ) : viewMode === "list" ? (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Developer</th>
                      <th className="px-6 py-4">Country</th>
                      <th className="px-6 py-4">Founded</th>
                      <th className="px-6 py-4">Games</th>
                      <th className="px-6 py-4">Featured Titles</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevelopers.map((developer, index) => (
                      <tr
                        className={`border-b border-white/10 ${
                          index === 0 ? "outline outline-1 outline-violet-500" : ""
                        }`}
                        key={developer.id}
                      >
                        <td className="px-6 py-5">
                          <button
                            className="flex items-center gap-4 text-left"
                            onClick={() => setSelectedDeveloper(developer)}
                            type="button"
                          >
                            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                              {developer.logo}
                            </span>
                            <span>
                              <span className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {developer.name}
                                </span>
                                {developer.featured ? (
                                  <span className="rounded-lg bg-violet-500/30 px-2 py-1 text-xs font-bold text-violet-100">
                                    Featured
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-1 block text-sm text-slate-400">
                                {developer.description}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {developer.country}
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {developer.founded}
                        </td>
                        <td className="px-6 py-5 text-white">
                          {developer.games}
                          <div className="text-xs text-slate-500">games</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {developer.featuredTitles.map((image) => (
                              <img
                                alt={developer.name}
                                className="h-14 w-20 rounded-lg border border-white/10 object-cover"
                                key={image}
                                src={image}
                              />
                            ))}
                            <span className="rounded-full border border-violet-400/40 px-2 py-1 text-xs text-violet-200">
                              +{developer.games - 3}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-4 text-lg">
                            <button type="button">⊙</button>
                            <button type="button">✎</button>
                            <button className="text-red-400" type="button">
                              ⌫
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDevelopers.map((developer) => (
                    <article
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
                      key={developer.id}
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                          {developer.logo}
                        </div>
                        <div>
                          <h2 className="font-bold text-white">{developer.name}</h2>
                          <p className="text-sm text-slate-400">{developer.country}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-300">
                        {developer.description}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {selectedDeveloper ? (
                <>
                  <div className="h-36 bg-[radial-gradient(circle_at_40%_30%,rgba(139,92,246,0.75),transparent_30%),linear-gradient(135deg,#1e1b4b,#020617)]" />
                  <div className="p-6">
                    <div className="-mt-20 flex items-end gap-5">
                      <div className="grid h-28 w-28 place-items-center rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-600 to-sky-600 text-3xl font-black text-white shadow-xl">
                        {selectedDeveloper.logo}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-white">
                            {selectedDeveloper.name}
                          </h2>
                          {selectedDeveloper.featured ? (
                            <span className="rounded-lg bg-violet-500/30 px-2 py-1 text-xs font-bold text-violet-100">
                              Featured
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {selectedDeveloper.description}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {selectedDeveloper.country}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Website</dt>
                        <dd className="text-violet-200">
                          {selectedDeveloper.websiteUrl}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Email</dt>
                        <dd className="text-violet-200">{selectedDeveloper.email}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Founded</dt>
                        <dd>{selectedDeveloper.founded}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Team Size</dt>
                        <dd>{selectedDeveloper.teamSize}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Status</dt>
                        <dd
                          className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${badgeClass(
                            selectedDeveloper.status
                          )}`}
                        >
                          {selectedDeveloper.status}
                        </dd>
                      </div>
                    </dl>

                    <section className="mt-6">
                      <h3 className="font-bold text-white">Genre Focus</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDeveloper.focus.map((focus) => (
                          <span
                            className="rounded-lg bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-100"
                            key={focus}
                          >
                            {focus}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section className="mt-6">
                      <h3 className="font-bold text-white">
                        About {selectedDeveloper.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {selectedDeveloper.about}
                      </p>
                    </section>

                    <a
                      className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                      href={selectedDeveloper.websiteUrl ?? "#"}
                    >
                      View Full Profile
                    </a>
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameDevelopersPage;
