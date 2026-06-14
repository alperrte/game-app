import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { GamePublisher, GamePublisherRequest } from "../types/gameTypes";

type PublisherStatus = "active" | "inactive";

type PublisherRow = GamePublisher & {
  games: number;
  logo: string;
  status: PublisherStatus;
};

type PublisherForm = {
  description: string;
  name: string;
  status: PublisherStatus;
};

const mockPublishers: PublisherRow[] = [
  {
    id: 901,
    name: "Sony Interactive Entertainment",
    description:
      "Global leader in interactive entertainment with PlayStation games and services.",
    websiteUrl: "https://www.playstation.com",
    country: "Japan",
    games: 256,
    logo: "PS",
    status: "active",
    createdAt: "2024-05-24T10:42:00",
    updatedAt: "2024-05-24T10:42:00",
  },
  {
    id: 902,
    name: "Xbox Game Studios",
    description: "Microsoft's first-party game development studio and publisher.",
    websiteUrl: "https://www.xbox.com",
    country: "United States",
    games: 184,
    logo: "XB",
    status: "active",
    createdAt: "2024-05-10T10:42:00",
    updatedAt: "2024-05-10T10:42:00",
  },
  {
    id: 903,
    name: "Nintendo",
    description: "Creator of iconic games and franchises for Nintendo platforms.",
    websiteUrl: "https://www.nintendo.com",
    country: "Japan",
    games: 156,
    logo: "N",
    status: "active",
    createdAt: "2024-04-22T10:42:00",
    updatedAt: "2024-04-22T10:42:00",
  },
  {
    id: 904,
    name: "Electronic Arts",
    description: "World-renowned publisher of sports, action, and RPG games.",
    websiteUrl: "https://www.ea.com",
    country: "United States",
    games: 132,
    logo: "EA",
    status: "active",
    createdAt: "2024-04-03T10:42:00",
    updatedAt: "2024-04-03T10:42:00",
  },
  {
    id: 905,
    name: "Activision Blizzard",
    description: "Leading publisher of action and adventure games and live services.",
    websiteUrl: "https://www.activisionblizzard.com",
    country: "United States",
    games: 98,
    logo: "AB",
    status: "active",
    createdAt: "2024-03-18T10:42:00",
    updatedAt: "2024-03-18T10:42:00",
  },
  {
    id: 906,
    name: "Ubisoft",
    description: "Creator of immersive worlds and unforgettable gaming experiences.",
    websiteUrl: "https://www.ubisoft.com",
    country: "France",
    games: 86,
    logo: "U",
    status: "inactive",
    createdAt: "2024-02-12T10:42:00",
    updatedAt: "2024-02-12T10:42:00",
  },
];

const emptyForm: PublisherForm = {
  name: "",
  description: "",
  status: "active",
};

const mapPublisherToForm = (publisher: PublisherRow): PublisherForm => {
  return {
    name: publisher.name,
    description: publisher.description ?? "",
    status: publisher.status,
  };
};

const mapBackendPublisher = (
  publisher: GamePublisher,
  index: number
): PublisherRow => {
  const mockPublisher = mockPublishers[index % mockPublishers.length];

  return {
    ...publisher,
    description: publisher.description ?? "No publisher description provided.",
    games: 40 + ((publisher.id * 29 + index * 17) % 260),
    logo: publisher.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    status: index % 6 === 0 ? "inactive" : "active",
    websiteUrl: publisher.websiteUrl ?? mockPublisher.websiteUrl,
    country: publisher.country ?? mockPublisher.country,
  };
};

const statusBadgeClass = (status: PublisherStatus) => {
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

const GamePublishersPage = () => {
  const [publishers, setPublishers] = useState<PublisherRow[]>([]);
  const [selectedPublisher, setSelectedPublisher] =
    useState<PublisherRow | null>(null);
  const [formValue, setFormValue] = useState<PublisherForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PublisherStatus>(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    gameService
      .getPublishers()
      .then((backendPublishers) => {
        if (!active) {
          return;
        }

        const nextPublishers =
          backendPublishers.length > 0
            ? backendPublishers.map(mapBackendPublisher)
            : mockPublishers;

        setPublishers(nextPublishers);
        setSelectedPublisher(nextPublishers[0] ?? null);
        setFormValue(
          nextPublishers[0] ? mapPublisherToForm(nextPublishers[0]) : emptyForm
        );
        setNotice(
          backendPublishers.length > 0
            ? null
            : "Backend returned no publishers, showing mock data."
        );
      })
      .catch(() => {
        if (active) {
          setPublishers(mockPublishers);
          setSelectedPublisher(mockPublishers[0]);
          setFormValue(mapPublisherToForm(mockPublishers[0]));
          setNotice("Backend is unavailable, showing mock publisher data.");
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
    const activePublishers = publishers.filter(
      (publisher) => publisher.status === "active"
    ).length;
    const inactivePublishers = publishers.length - activePublishers;
    const totalGames = publishers.reduce(
      (total, publisher) => total + publisher.games,
      0
    );

    return {
      activePublishers,
      inactivePublishers,
      totalGames,
      totalPublishers: publishers.length,
    };
  }, [publishers]);

  const filteredPublishers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return publishers.filter((publisher) => {
      const matchesSearch =
        !normalizedSearch ||
        `${publisher.name} ${publisher.description}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || publisher.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [publishers, search, statusFilter]);

  const selectPublisher = (publisher: PublisherRow) => {
    setSelectedPublisher(publisher);
    setFormValue(mapPublisherToForm(publisher));
    setNotice(null);
  };

  const addPublisher = () => {
    setSelectedPublisher(null);
    setFormValue(emptyForm);
    setNotice("Edit the details panel to create a new publisher.");
  };

  const savePublisher = async () => {
    const request: GamePublisherRequest = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || null,
      websiteUrl: selectedPublisher?.websiteUrl ?? null,
      country: selectedPublisher?.country ?? null,
    };

    if (!request.name) {
      setNotice("Publisher name is required.");
      return;
    }

    setSaving(true);

    try {
      if (selectedPublisher) {
        const updatedPublisher = await gameService.updatePublisher(
          selectedPublisher.id,
          request
        );
        const nextPublisher: PublisherRow = {
          ...selectedPublisher,
          ...updatedPublisher,
          description: updatedPublisher.description ?? request.description ?? null,
          status: formValue.status,
        };
        setPublishers((currentPublishers) =>
          currentPublishers.map((publisher) =>
            publisher.id === nextPublisher.id ? nextPublisher : publisher
          )
        );
        setSelectedPublisher(nextPublisher);
        setNotice("Publisher updated successfully.");
      } else {
        const createdPublisher = await gameService.createPublisher(request);
        const nextPublisher: PublisherRow = {
          ...createdPublisher,
          description: createdPublisher.description ?? request.description ?? null,
          country: createdPublisher.country ?? null,
          games: 0,
          logo: createdPublisher.name.charAt(0).toUpperCase(),
          status: formValue.status,
          websiteUrl: createdPublisher.websiteUrl ?? null,
        };
        setPublishers((currentPublishers) => [nextPublisher, ...currentPublishers]);
        setSelectedPublisher(nextPublisher);
        setNotice("Publisher created successfully.");
      }
    } catch {
      setNotice("Backend save failed. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const deletePublisher = async (publisher: PublisherRow) => {
    const confirmed = window.confirm(
      `Delete ${publisher.name}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await gameService.deletePublisher(publisher.id);
      setPublishers((currentPublishers) =>
        currentPublishers.filter(
          (currentPublisher) => currentPublisher.id !== publisher.id
        )
      );
      if (selectedPublisher?.id === publisher.id) {
        const nextPublisher = publishers.find(
          (currentPublisher) => currentPublisher.id !== publisher.id
        );
        setSelectedPublisher(nextPublisher ?? null);
        setFormValue(nextPublisher ? mapPublisherToForm(nextPublisher) : emptyForm);
      }
      setNotice("Publisher deleted successfully.");
    } catch {
      setNotice("Backend delete failed. Please try again later.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Publishers" />

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                ♘
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Game Publishers
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Manage game publishers and the games they publish on the
                  platform.
                </p>
              </div>
            </div>

            <button
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              onClick={addPublisher}
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Publisher
            </button>
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Total publishers on platform"
              icon="♘"
              label="Total Publishers"
              value={String(stats.totalPublishers)}
            />
            <StatCard
              accent="bg-indigo-500/15 text-indigo-300"
              helper="Across all publishers"
              icon="🎮"
              label="Total Games"
              value={stats.totalGames.toLocaleString("en")}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="Currently active"
              icon="●"
              label="Active Publishers"
              value={String(stats.activePublishers)}
            />
            <StatCard
              accent="bg-red-500/15 text-red-300"
              helper="Currently inactive"
              icon="⊙"
              label="Inactive Publishers"
              value={String(stats.inactivePublishers)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_580px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
                <h2 className="text-xl font-bold text-white">
                  Publishers ({publishers.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  <label className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                      ⌕
                    </span>
                    <input
                      className="h-12 w-72 rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search publishers..."
                      value={search}
                    />
                  </label>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | PublisherStatus)
                    }
                    value={statusFilter}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {notice ? (
                <div className="m-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
                  {notice}
                </div>
              ) : null}

              {loading ? (
                <div className="h-96 animate-pulse bg-slate-900/70" />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Publisher</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Games</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPublishers.map((publisher) => (
                      <tr className="border-b border-white/10" key={publisher.id}>
                        <td className="px-6 py-5">
                          <button
                            className="flex items-center gap-4 text-left"
                            onClick={() => selectPublisher(publisher)}
                            type="button"
                          >
                            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 text-sm font-black text-white">
                              {publisher.logo}
                            </span>
                            <span className="font-bold text-white">
                              {publisher.name}
                            </span>
                          </button>
                        </td>
                        <td className="max-w-md px-6 py-5 text-slate-300">
                          {publisher.description}
                        </td>
                        <td className="px-6 py-5 text-slate-200">
                          {publisher.games}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                              publisher.status
                            )}`}
                          >
                            ● {publisher.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-3">
                            <button
                              className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200"
                              onClick={() => selectPublisher(publisher)}
                              type="button"
                            >
                              ✎
                            </button>
                            <button
                              className="grid h-11 w-11 place-items-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300"
                              onClick={() => void deletePublisher(publisher)}
                              type="button"
                            >
                              ⌫
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex items-center justify-center gap-3 border-t border-white/10 p-5">
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-slate-300" type="button">
                  ‹
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white" type="button">
                  1
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-slate-300" type="button">
                  2
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-slate-300" type="button">
                  ›
                </button>
              </div>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Publisher Details</h2>
                <span className="rounded-lg bg-violet-500/15 px-3 py-2 text-sm font-bold text-violet-200">
                  Edit Mode
                </span>
              </div>

              <div className="mb-7 flex items-center gap-5">
                <div className="grid h-24 w-24 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600 to-sky-600 text-2xl font-black text-white">
                  {(
                    selectedPublisher?.logo ??
                    (formValue.name.charAt(0) || "P")
                  ).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-white">
                      {formValue.name || "New Publisher"}
                    </h3>
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(
                        formValue.status
                      )}`}
                    >
                      ● {formValue.status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    {formValue.description || "Publisher description will appear here."}
                  </p>
                </div>
              </div>

              <form
                className="space-y-5 border-t border-white/10 pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void savePublisher();
                }}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Name</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setFormValue({ ...formValue, name: event.target.value })
                    }
                    value={formValue.name}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Description
                  </span>
                  <textarea
                    className="min-h-32 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-violet-400/70"
                    maxLength={1000}
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        description: event.target.value,
                      })
                    }
                    value={formValue.description}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Status</span>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setFormValue({
                        ...formValue,
                        status: event.target.value as PublisherStatus,
                      })
                    }
                    value={formValue.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <button
                    className="h-14 rounded-xl border border-white/10 bg-slate-950/60 text-sm font-bold text-white"
                    onClick={() => {
                      if (selectedPublisher) {
                        setFormValue(mapPublisherToForm(selectedPublisher));
                      } else {
                        setFormValue(emptyForm);
                      }
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="h-14 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
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

export default GamePublishersPage;
