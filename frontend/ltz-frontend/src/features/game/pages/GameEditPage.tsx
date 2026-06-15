import { useEffect, useState } from "react";
import { GAME_ROUTES } from "../../../lib/constants";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { Game, GameRequest } from "../types/gameTypes";

type EditGameForm = GameRequest & {
  fullDescription: string;
  galleryImages: string[];
  price: string;
  shortDescription: string;
  slug: string;
  subcategory: string;
};

const galleryFallback = [
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=260&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=260&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=260&q=80",
];

const getGameIdFromPath = () => {
  const match = window.location.pathname.match(/^\/games\/(\d+)\/edit$/);
  return match ? Number(match[1]) : null;
};

const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "No update date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const mapGameToForm = (game: Game): EditGameForm => {
  const description = game.description ?? "";

  return {
    title: game.title,
    slug: createSlug(game.title),
    shortDescription: description.slice(0, 160),
    fullDescription: description,
    description,
    genre: game.genre ?? "",
    subcategory: "Simulation",
    developer: game.developer ?? "",
    publisher: game.publisher ?? "",
    releaseDate: game.releaseDate ?? "",
    price: "29.99",
    platform: game.platform ?? "",
    supportedLanguages: game.supportedLanguages ?? "",
    coverImageUrl: game.coverImageUrl ?? "",
    galleryImages: galleryFallback,
    earlyAccess: game.earlyAccess,
    onSale: game.onSale,
    turkishLanguageSupport: game.turkishLanguageSupport,
    minimumSystemRequirements: game.minimumSystemRequirements ?? "",
    recommendedSystemRequirements: game.recommendedSystemRequirements ?? "",
    popularityScore: game.popularityScore,
  };
};

const normalizeGameRequest = (value: EditGameForm): GameRequest => {
  return {
    title: value.title.trim(),
    description: emptyToNull(value.fullDescription || value.shortDescription),
    genre: emptyToNull(value.genre),
    platform: emptyToNull(value.platform),
    releaseDate: emptyToNull(value.releaseDate),
    developer: emptyToNull(value.developer),
    publisher: emptyToNull(value.publisher),
    supportedLanguages: emptyToNull(value.supportedLanguages),
    coverImageUrl: emptyToNull(value.coverImageUrl),
    earlyAccess: value.earlyAccess ?? false,
    onSale: value.onSale ?? false,
    turkishLanguageSupport: value.turkishLanguageSupport ?? false,
    minimumSystemRequirements: emptyToNull(value.minimumSystemRequirements),
    recommendedSystemRequirements: emptyToNull(value.recommendedSystemRequirements),
    popularityScore: value.popularityScore ?? 0,
  };
};

const FieldLabel = ({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) => {
  return (
    <span className="text-sm font-semibold text-white">
      {children}
      {required ? <span className="text-red-400"> *</span> : null}
    </span>
  );
};

const DetailBadge = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1 text-sm font-semibold text-slate-100">
        {value}
      </span>
    </div>
  );
};

const GameEditPage = () => {
  const [gameId] = useState(() => getGameIdFromPath());
  const [originalGame, setOriginalGame] = useState<Game | null>(null);
  const [initialForm, setInitialForm] = useState<EditGameForm | null>(null);
  const [formValue, setFormValue] = useState<EditGameForm | null>(null);
  const [initialLoading, setInitialLoading] = useState(() => gameId !== null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    gameId ? null : "Invalid game id."
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const loadGame = async () => {
      setInitialLoading(true);
      setError(null);

      try {
        const game = await gameService.getGameById(gameId);
        const mappedForm = mapGameToForm(game);
        setOriginalGame(game);
        setInitialForm(mappedForm);
        setFormValue(mappedForm);
      } catch {
        setError("Game information could not be loaded.");
      } finally {
        setInitialLoading(false);
      }
    };

    void loadGame();
  }, [gameId]);

  const setField = <TKey extends keyof EditGameForm>(
    key: TKey,
    value: EditGameForm[TKey]
  ) => {
    setFormValue((currentValue) =>
      currentValue ? { ...currentValue, [key]: value } : currentValue
    );
  };

  const handleSave = async () => {
    if (!gameId || !formValue) {
      return;
    }

    const request = normalizeGameRequest(formValue);

    if (!request.title) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const updatedGame = await gameService.updateGame(gameId, request);
      const mappedForm = mapGameToForm(updatedGame);
      setOriginalGame(updatedGame);
      setInitialForm(mappedForm);
      setFormValue(mappedForm);
      setNotice("Changes saved successfully.");
    } catch {
      setError("Game could not be updated. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (initialForm) {
      setFormValue(initialForm);
      setNotice("Form reset to the last loaded game data.");
      setError(null);
    }
  };

  const handleDelete = async () => {
    if (!gameId) {
      return;
    }

    const confirmed = window.confirm(
      "Deleting a game is permanent. Do you want to continue?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      await gameService.deleteGame(gameId);
      window.history.pushState({}, "", GAME_ROUTES.games);
      window.dispatchEvent(new Event("popstate"));
    } catch {
      setError("Game could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
        <GameNavbar activeItem="Games" />
        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <div className="h-[680px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
        </main>
      </div>
    );
  }

  if (!formValue || !originalGame) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
        <GameNavbar activeItem="Games" />
        <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[900px] place-items-center px-8 py-8">
          <section className="w-full rounded-3xl border border-red-400/20 bg-red-950/20 p-10 text-center">
            <h1 className="text-2xl font-bold text-white">Game not found</h1>
            <p className="mt-3 text-sm text-red-100">
              {error ?? "No game record matches this id."}
            </p>
            <a
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
              href={GAME_ROUTES.games}
            >
              Back to games
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Games" />

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-5 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <a
                className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-slate-950/60 text-3xl text-white"
                href={GAME_ROUTES.games}
              >
                ←
              </a>
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl text-violet-300">
                ♘
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Edit Game
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Update game details, media, and settings.
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              Last updated: {formatDateTime(originalGame.updatedAt)}
            </div>
          </section>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-950/25 px-5 py-4 text-sm text-emerald-100">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_610px]">
            <form
              className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/55 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <h2 className="text-xl font-bold text-white">Game Information</h2>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>Title</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) => setField("title", event.target.value)}
                    value={formValue.title}
                  />
                  <span className="text-xs text-slate-500">
                    The official name of the game.
                  </span>
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Slug</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("slug", event.target.value)}
                    value={formValue.slug}
                  />
                  <span className="text-xs text-slate-500">
                    URL-friendly version. Used in game page links.
                  </span>
                </label>
              </div>

              <label className="grid gap-2">
                <FieldLabel required>Short Description</FieldLabel>
                <textarea
                  className="min-h-20 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/70"
                  maxLength={160}
                  onChange={(event) =>
                    setField("shortDescription", event.target.value)
                  }
                  value={formValue.shortDescription}
                />
                <span className="text-right text-xs text-slate-500">
                  {formValue.shortDescription.length} / 160
                </span>
              </label>

              <label className="grid gap-2">
                <FieldLabel required>Full Description</FieldLabel>
                <textarea
                  className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/70"
                  maxLength={2000}
                  onChange={(event) =>
                    setField("fullDescription", event.target.value)
                  }
                  value={formValue.fullDescription}
                />
                <span className="text-right text-xs text-slate-500">
                  {formValue.fullDescription.length} / 2000
                </span>
              </label>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>Category</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("genre", event.target.value)}
                    value={formValue.genre ?? ""}
                  >
                    <option value="">Select category</option>
                    <option value="Action">Action</option>
                    <option value="RPG">RPG</option>
                    <option value="Simulation">Simulation</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Racing">Racing</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Subcategory</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("subcategory", event.target.value)
                    }
                    value={formValue.subcategory}
                  >
                    <option value="Simulation">Simulation</option>
                    <option value="Open World">Open World</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Developer</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("developer", event.target.value)
                    }
                    value={formValue.developer ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Publisher</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("publisher", event.target.value)
                    }
                    value={formValue.publisher ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Release Date</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("releaseDate", event.target.value)
                    }
                    type="date"
                    value={formValue.releaseDate ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Price (USD)</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("price", event.target.value)}
                    value={formValue.price}
                  />
                  <span className="text-xs text-slate-500">
                    Use 0 for free games.
                  </span>
                </label>

                <label className="grid gap-2 lg:col-span-2">
                  <FieldLabel required>Platforms</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("platform", event.target.value)
                    }
                    placeholder="PC, PlayStation 5"
                    value={formValue.platform ?? ""}
                  />
                </label>
              </div>

              <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h2 className="text-xl font-bold text-white">Game Media</h2>
                <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                  <label className="grid gap-2">
                    <FieldLabel required>Cover Image</FieldLabel>
                    <input
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setField("coverImageUrl", event.target.value)
                      }
                      value={formValue.coverImageUrl ?? ""}
                    />
                  </label>

                  <div>
                    <FieldLabel>Gallery Images</FieldLabel>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {formValue.galleryImages.map((image) => (
                        <img
                          alt="Gallery"
                          className="h-16 w-28 rounded-lg border border-white/10 object-cover"
                          key={image}
                          src={image}
                        />
                      ))}
                      <button
                        className="h-16 w-28 rounded-lg border border-dashed border-violet-400/40 text-sm font-semibold text-violet-200"
                        type="button"
                      >
                        + Add Images
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="mb-4 text-xl font-bold text-white">Current Cover</h2>
                {formValue.coverImageUrl ? (
                  <img
                    alt={formValue.title}
                    className="h-64 w-full rounded-2xl object-cover"
                    src={formValue.coverImageUrl}
                  />
                ) : (
                  <div className="grid h-64 place-items-center rounded-2xl bg-slate-900 text-slate-500">
                    No cover image
                  </div>
                )}
                <button
                  className="mt-4 h-12 w-full rounded-xl border border-violet-400/40 text-sm font-bold text-violet-200"
                  type="button"
                >
                  Change Cover
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="mb-5 text-xl font-bold text-white">Game Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailBadge
                    label="Status"
                    value={formValue.onSale ? "On Sale" : "Active"}
                  />
                  <DetailBadge label="Visibility" value="Public" />
                  <DetailBadge
                    label="Early Access"
                    value={formValue.earlyAccess ? "Yes" : "No"}
                  />
                  <DetailBadge
                    label="On Sale"
                    value={formValue.onSale ? "Yes" : "No"}
                  />
                  <DetailBadge label="Discount" value={formValue.onSale ? "20%" : "0%"} />
                  <DetailBadge
                    label="Created At"
                    value={formatDateTime(originalGame.createdAt)}
                  />
                  <DetailBadge
                    label="Last Updated"
                    value={formatDateTime(originalGame.updatedAt)}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="mb-5 text-xl font-bold text-white">Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
                    disabled={submitting || deleting}
                    onClick={() => void handleSave()}
                    type="button"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="h-12 rounded-xl border border-white/10 bg-slate-900/80 px-6 text-sm font-bold text-white"
                    onClick={handleReset}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    className="h-12 rounded-xl border border-red-500/50 bg-red-500/10 px-6 text-sm font-bold text-red-200 disabled:opacity-60"
                    disabled={submitting || deleting}
                    onClick={() => void handleDelete()}
                    type="button"
                  >
                    {deleting ? "Deleting..." : "Delete Game"}
                  </button>
                </div>
                <p className="mt-5 text-sm leading-6 text-red-200">
                  Deleting a game is permanent and cannot be undone. This action
                  will remove the game and all associated data.
                </p>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameEditPage;
