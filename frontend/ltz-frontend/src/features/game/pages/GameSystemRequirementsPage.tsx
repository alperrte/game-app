import { useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";

type RequirementStatus = "active" | "compliant" | "warning";

type RequirementSet = {
  id: number;
  contact: string;
  founded: number;
  game: string;
  gamesCovered: number;
  headquarters: string;
  lastUpdated: string;
  logo: string;
  minCoverage: number;
  notes: string;
  platform: string;
  recentGame: string;
  recCoverage: number;
  requirementSets: number;
  status: RequirementStatus;
  teamSize: string;
  type: string;
  website: string;
};

const mockRequirements: RequirementSet[] = [
  {
    id: 1001,
    game: "Aurora Interactive",
    platform: "North America",
    type: "PC",
    lastUpdated: "2024-05-26T10:30:00",
    minCoverage: 98,
    recCoverage: 96,
    status: "active",
    logo: "A",
    website: "aurorainteractive.com",
    contact: "contact@aurorainteractive.com",
    headquarters: "Seattle, Washington, USA",
    founded: 2016,
    teamSize: "51 - 100",
    gamesCovered: 24,
    requirementSets: 28,
    recentGame: "Eclipse Frontier",
    notes:
      "Aurora Interactive is a leading independent publisher focused on narrative-driven RPGs and immersive sci-fi experiences for PC and next-gen consoles.",
  },
  {
    id: 1002,
    game: "Titan Realm Publishing",
    platform: "Europe",
    type: "PC",
    lastUpdated: "2024-05-25T10:30:00",
    minCoverage: 95,
    recCoverage: 93,
    status: "compliant",
    logo: "T",
    website: "titanrealm.com",
    contact: "ops@titanrealm.com",
    headquarters: "London, United Kingdom",
    founded: 2014,
    teamSize: "25 - 50",
    gamesCovered: 18,
    requirementSets: 22,
    recentGame: "Myth of Anatolia",
    notes: "European RPG and strategy publisher with strong PC coverage.",
  },
  {
    id: 1003,
    game: "Blue Nova",
    platform: "Asia",
    type: "PC",
    lastUpdated: "2024-05-24T10:30:00",
    minCoverage: 90,
    recCoverage: 88,
    status: "warning",
    logo: "B",
    website: "bluenova.games",
    contact: "hello@bluenova.games",
    headquarters: "Tokyo, Japan",
    founded: 2018,
    teamSize: "10 - 25",
    gamesCovered: 12,
    requirementSets: 16,
    recentGame: "Cybernetica",
    notes: "Some recommended requirement sets need review for newer GPUs.",
  },
  {
    id: 1004,
    game: "Emberline Media",
    platform: "Europe",
    type: "Console",
    lastUpdated: "2024-05-23T10:30:00",
    minCoverage: 92,
    recCoverage: 90,
    status: "compliant",
    logo: "E",
    website: "emberlinemedia.io",
    contact: "support@emberlinemedia.io",
    headquarters: "Berlin, Germany",
    founded: 2019,
    teamSize: "25 - 50",
    gamesCovered: 16,
    requirementSets: 19,
    recentGame: "Forest Whisper",
    notes: "Console and PC requirement records are aligned.",
  },
  {
    id: 1005,
    game: "North Arc",
    platform: "Oceania",
    type: "PC",
    lastUpdated: "2024-05-22T10:30:00",
    minCoverage: 89,
    recCoverage: 85,
    status: "warning",
    logo: "N",
    website: "northarc.gg",
    contact: "contact@northarc.gg",
    headquarters: "Sydney, Australia",
    founded: 2020,
    teamSize: "10 - 25",
    gamesCovered: 9,
    requirementSets: 11,
    recentGame: "Last Haven",
    notes: "Minimum requirements are complete; recommended coverage needs updates.",
  },
];

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const statusBadgeClass = (status: RequirementStatus) => {
  if (status === "warning") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-200";
  }

  return "border-emerald-400/20 bg-emerald-500/15 text-emerald-200";
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

const GameSystemRequirementsPage = () => {
  const [requirements] = useState<RequirementSet[]>(mockRequirements);
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementSet>(
    mockRequirements[0]
  );
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [type, setType] = useState("all");

  const platforms = useMemo(() => {
    return Array.from(new Set(requirements.map((requirement) => requirement.platform))).sort();
  }, [requirements]);

  const types = useMemo(() => {
    return Array.from(new Set(requirements.map((requirement) => requirement.type))).sort();
  }, [requirements]);

  const stats = useMemo(() => {
    const compliantSets = requirements.filter(
      (requirement) => requirement.status !== "warning"
    ).length;

    return {
      compliantSets,
      gamesCovered: requirements.reduce(
        (total, requirement) => total + requirement.gamesCovered,
        0
      ),
      recentlyUpdated: requirements.length,
      totalSets: requirements.reduce(
        (total, requirement) => total + requirement.requirementSets,
        0
      ),
    };
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requirements
      .filter((requirement) => {
        const matchesSearch =
          !normalizedSearch ||
          `${requirement.game} ${requirement.website}`
            .toLowerCase()
            .includes(normalizedSearch);
        const matchesPlatform =
          platform === "all" || requirement.platform === platform;
        const matchesType = type === "all" || requirement.type === type;

        return matchesSearch && matchesPlatform && matchesType;
      })
      .sort((leftRequirement, rightRequirement) =>
        rightRequirement.lastUpdated.localeCompare(leftRequirement.lastUpdated)
      );
  }, [platform, requirements, search, type]);

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="SystemRequirements" />

        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                ▥
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  System Requirements
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Compare and manage system requirements across different games
                  and platforms.
                </p>
              </div>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Requirement Set
            </button>
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="vs last 30 days"
              icon="♙"
              label="Total Requirement Sets"
              value={String(stats.totalSets)}
            />
            <StatCard
              accent="bg-indigo-500/15 text-indigo-300"
              helper="vs last 30 days"
              icon="♘"
              label="Games Covered"
              value={String(stats.gamesCovered)}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="vs last 30 days"
              icon="◇"
              label="Compliant Sets"
              value={String(stats.compliantSets)}
            />
            <StatCard
              accent="bg-pink-500/15 text-pink-300"
              helper="vs last 30 days"
              icon="▣"
              label="Recently Updated"
              value={String(stats.recentlyUpdated)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_520px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[1.2fr_0.65fr_0.85fr_1fr]">
                <label className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ⌕
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search requirement sets..."
                    value={search}
                  />
                </label>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setPlatform(event.target.value)}
                  value={platform}
                >
                  <option value="all">All Platforms</option>
                  {platforms.map((nextPlatform) => (
                    <option key={nextPlatform} value={nextPlatform}>
                      {nextPlatform}
                    </option>
                  ))}
                </select>

                <select
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setType(event.target.value)}
                  value={type}
                >
                  <option value="all">All Requirement Types</option>
                  {types.map((nextType) => (
                    <option key={nextType} value={nextType}>
                      {nextType}
                    </option>
                  ))}
                </select>

                <label className="grid h-12 grid-cols-[1fr_1.1fr] items-center gap-3 text-sm text-slate-400">
                  <span className="text-right">Sort by:</span>
                  <select className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none">
                    <option>Newest First</option>
                  </select>
                </label>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Game / Requirement Set</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Requirement Type</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4">Min. / Rec. Coverage</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((requirement, index) => (
                    <tr
                      className={`border-b border-white/10 ${
                        index === 0 ? "outline outline-1 outline-violet-500" : ""
                      }`}
                      key={requirement.id}
                    >
                      <td className="px-6 py-5">
                        <button
                          className="flex items-center gap-4 text-left"
                          onClick={() => setSelectedRequirement(requirement)}
                          type="button"
                        >
                          <span className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 text-2xl font-black text-white">
                            {requirement.logo}
                          </span>
                          <span>
                            <span className="font-bold text-white">
                              {requirement.game}
                            </span>
                            <span className="mt-1 block text-sm text-slate-400">
                              {requirement.website}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        {requirement.platform}
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm text-violet-100">
                          {requirement.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        {formatDate(requirement.lastUpdated)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="mb-2 font-bold text-white">
                          {requirement.minCoverage}% / {requirement.recCoverage}%
                        </div>
                        <div className="grid gap-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${requirement.minCoverage}%` }}
                            />
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${requirement.recCoverage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-3">
                          <button className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-300" type="button">
                            ⊙
                          </button>
                          <button className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/30 text-violet-300" type="button">
                            ✎
                          </button>
                          <button className="grid h-11 w-11 place-items-center rounded-xl border border-red-400/30 text-red-300" type="button">
                            ⌫
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-4xl font-black text-white">
                  {selectedRequirement.logo}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white">
                      {selectedRequirement.game}
                    </h2>
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                        selectedRequirement.status
                      )}`}
                    >
                      {selectedRequirement.status === "warning"
                        ? "Needs Review"
                        : "Active"}
                    </span>
                  </div>
                  <p className="mt-1 text-violet-300">
                    {selectedRequirement.website}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {selectedRequirement.platform} · Founded{" "}
                    {selectedRequirement.founded}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-8 border-b border-white/10">
                {["Overview", "Platforms", "Notes", "History"].map((tab, index) => (
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

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {selectedRequirement.notes}
              </p>

              <dl className="mt-6 grid gap-3 text-sm">
                {[
                  ["Headquarters", selectedRequirement.headquarters],
                  ["Team Size", selectedRequirement.teamSize],
                  ["Founded", String(selectedRequirement.founded)],
                  ["Games Covered", String(selectedRequirement.gamesCovered)],
                  ["Requirement Sets", String(selectedRequirement.requirementSets)],
                  ["Website", selectedRequirement.website],
                  ["Contact", selectedRequirement.contact],
                ].map(([label, value]) => (
                  <div className="grid grid-cols-[150px_1fr] gap-4" key={label}>
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="text-slate-100">{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="mt-8">
                <h3 className="font-bold text-white">Recent Updates</h3>
                <article className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <img
                    alt={selectedRequirement.recentGame}
                    className="h-16 w-20 rounded-xl object-cover"
                    src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=180&q=80"
                  />
                  <div>
                    <h4 className="font-bold text-white">
                      {selectedRequirement.recentGame}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {selectedRequirement.type} · Updated{" "}
                      {formatDate(selectedRequirement.lastUpdated)}
                    </p>
                  </div>
                </article>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameSystemRequirementsPage;
