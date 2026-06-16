import { isAxiosError } from "axios";
import { useMemo, useState } from "react";
import { GAME_ROUTES } from "../../../lib/constants";
import { useAuthStore } from "../../../store/authStore";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { GameRequest } from "../types/gameTypes";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

const initialValue: GameRequest = {
  title: "",
  description: "",
  genre: "",
  platform: "",
  releaseDate: "",
  developer: "",
  publisher: "",
  supportedLanguages: "",
  coverImageUrl: "",
  earlyAccess: false,
  onSale: false,
  turkishLanguageSupport: false,
  minimumSystemRequirements: "",
  recommendedSystemRequirements: "",
  popularityScore: 0,
};

const genreOptions = [
  { label: "Aksiyon", value: "Action" },
  { label: "Macera", value: "Adventure" },
  { label: "RPG", value: "RPG" },
  { label: "Simülasyon", value: "Simulation" },
  { label: "Strateji", value: "Strategy" },
  { label: "Yarış", value: "Racing" },
  { label: "Spor", value: "Sports" },
  { label: "Bağımsız", value: "Indie" },
];

const platformOptions = [
  { label: "Windows", value: "Windows" },
  { label: "Windows, Steam", value: "Windows, Steam" },
  { label: "PlayStation", value: "PlayStation" },
  { label: "Xbox", value: "Xbox" },
  { label: "Nintendo Switch", value: "Nintendo Switch" },
  { label: "Mobil", value: "Mobile" },
];

const languageOptions = [
  { label: "İngilizce", value: "English" },
  { label: "İngilizce, Türkçe", value: "English, Turkish" },
  { label: "Türkçe", value: "Turkish" },
  {
    label: "İngilizce, Türkçe, Almanca, Fransızca",
    value: "English, Turkish, German, French",
  },
];

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizeGameRequest = (value: GameRequest): GameRequest => {
  return {
    title: value.title.trim(),
    description: emptyToNull(value.description),
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

const getCreateGameErrorMessage = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    return ADMIN_ACTION_MESSAGE;
  }

  return "Oyun oluşturulamadı. Lütfen formu kontrol edip tekrar deneyin.";
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

const ToggleCard = ({
  active,
  description,
  icon,
  label,
  onToggle,
}: {
  active: boolean;
  description: string;
  icon: string;
  label: string;
  onToggle: () => void;
}) => {
  return (
    <button
      className="flex min-h-20 items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left transition hover:border-violet-400/40"
      onClick={onToggle}
      type="button"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
          {icon}
        </span>
        <span>
          <span className="block font-bold text-white">{label}</span>
          <span className="mt-1 block text-sm text-slate-400">{description}</span>
        </span>
      </span>
      <span
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
          active ? "bg-violet-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${
            active ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
};

const RequirementBox = ({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string | null | undefined;
}) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white">{label}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Specify requirements for this game.
          </p>
        </div>
        <span className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
          + Gereksinim Ekle
        </span>
      </div>
      <textarea
        className="min-h-28 w-full rounded-xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
        maxLength={2000}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Henüz gereksinim eklenmedi."
        value={value ?? ""}
      />
    </section>
  );
};

const GameCreatePage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [formValue, setFormValue] = useState<GameRequest>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <TKey extends keyof GameRequest>(
    key: TKey,
    value: GameRequest[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const checklist = useMemo(
    () => [
      { label: "Başlık", complete: Boolean(formValue.title.trim()), required: true },
      {
        label: "Açıklama",
        complete: Boolean(formValue.description?.trim()),
        required: true,
      },
      { label: "Tür", complete: Boolean(formValue.genre), required: true },
      { label: "Platform", complete: Boolean(formValue.platform), required: true },
      {
        label: "Çıkış Tarihi",
        complete: Boolean(formValue.releaseDate),
        required: true,
      },
      {
        label: "Kapak Görseli",
        complete: Boolean(formValue.coverImageUrl?.trim()),
        required: true,
      },
      {
        label: "Geliştirici",
        complete: Boolean(formValue.developer?.trim()),
        required: false,
      },
      {
        label: "Yayıncı",
        complete: Boolean(formValue.publisher?.trim()),
        required: false,
      },
    ],
    [formValue]
  );

  const handleSubmit = async () => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const request = normalizeGameRequest(formValue);

    if (!request.title) {
      setError("Başlık zorunludur.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await gameService.createGame(request);
      window.history.pushState({}, "", GAME_ROUTES.games);
      window.dispatchEvent(new Event("popstate"));
    } catch (createError) {
      setError(getCreateGameErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Games" />

        <main className="mx-auto max-w-[1840px] px-8 py-6">
          <section className="mb-5 flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl text-violet-300">
              ♘
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Yeni Oyun Oluştur
              </h1>
              <p className="mt-2 text-base text-slate-400">
                Fill in the details below to add a new game to the LobbyTwoZero
                platform.
              </p>
            </div>
          </section>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_540px]">
            <form
              className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <h2 className="mb-5 text-xl font-bold text-white">
                Oyun Bilgileri
              </h2>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>Başlık</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder="Oyun başlığını girin"
                    required
                    value={formValue.title}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Tür</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("genre", event.target.value)}
                    value={formValue.genre ?? ""}
                  >
                    <option value="">Tür seçin</option>
                    {genreOptions.map((genre) => (
                      <option key={genre.value} value={genre.value}>
                        {genre.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Açıklama</FieldLabel>
                  <textarea
                    className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setField("description", event.target.value)
                    }
                    placeholder="Oyun için kısa bir açıklama girin..."
                    value={formValue.description ?? ""}
                  />
                  <span className="text-right text-xs text-slate-500">
                    {(formValue.description ?? "").length} / 500
                  </span>
                </label>

                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <FieldLabel required>Platform</FieldLabel>
                    <select
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setField("platform", event.target.value)
                      }
                      value={formValue.platform ?? ""}
                    >
                      <option value="">Platform seçin</option>
                      {platformOptions.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <FieldLabel required>Çıkış Tarihi</FieldLabel>
                    <input
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setField("releaseDate", event.target.value)
                      }
                      type="date"
                      value={formValue.releaseDate ?? ""}
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <FieldLabel>Geliştirici</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("developer", event.target.value)
                    }
                    placeholder="Geliştirici adını girin"
                    value={formValue.developer ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Yayıncı</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("publisher", event.target.value)
                    }
                    placeholder="Yayıncı adını girin"
                    value={formValue.publisher ?? ""}
                  />
                </label>

                <label className="grid gap-2 lg:col-span-2">
                  <FieldLabel>Desteklenen Diller</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("supportedLanguages", event.target.value)
                    }
                    value={formValue.supportedLanguages ?? ""}
                  >
                    <option value="">Dil seçin</option>
                    {languageOptions.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 lg:col-span-2">
                  <FieldLabel required>Kapak Görseli URL</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setField("coverImageUrl", event.target.value)
                    }
                    placeholder="https://example.com/game-cover.jpg"
                    value={formValue.coverImageUrl ?? ""}
                  />
                  <span className="text-xs text-slate-500">
                    Oyun kapak görseli için doğrudan bir URL girin.
                  </span>
                </label>
              </div>

              <div className="my-6 grid gap-4 lg:grid-cols-3">
                <ToggleCard
                  active={formValue.earlyAccess === true}
                  description="Oyun erken erişim aşamasında."
                  icon="♘"
                  label="Erken Erişim"
                  onToggle={() =>
                    setField("earlyAccess", !(formValue.earlyAccess === true))
                  }
                />
                <ToggleCard
                  active={formValue.onSale === true}
                  description="Oyun şu anda indirimde."
                  icon="%"
                  label="İndirimde"
                  onToggle={() => setField("onSale", !(formValue.onSale === true))}
                />
                <ToggleCard
                  active={formValue.turkishLanguageSupport === true}
                  description="Oyun Türkçe dil desteği sunuyor."
                  icon="TR"
                  label="Türkçe Dil Desteği"
                  onToggle={() =>
                    setField(
                      "turkishLanguageSupport",
                      !(formValue.turkishLanguageSupport === true)
                    )
                  }
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <RequirementBox
                  label="Minimum Sistem Gereksinimleri"
                  onChange={(value) =>
                    setField("minimumSystemRequirements", value)
                  }
                  value={formValue.minimumSystemRequirements}
                />
                <RequirementBox
                  label="Önerilen Sistem Gereksinimleri"
                  onChange={(value) =>
                    setField("recommendedSystemRequirements", value)
                  }
                  value={formValue.recommendedSystemRequirements}
                />
              </div>

              <div className="mt-6 flex justify-end gap-4 border-t border-white/10 pt-5">
                <a
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 px-8 text-sm font-bold text-white"
                  href={GAME_ROUTES.games}
                >
                  İptal
                </a>
                {isAdmin ? (
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Oluşturuluyor..." : "Oyun Oluştur"}
                  </button>
                ) : null}
              </div>
            </form>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Canlı Önizleme</h2>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                    Anlık Önizleme
                  </span>
                </div>

                <article className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                  <div className="relative h-44">
                    {formValue.coverImageUrl ? (
                      <img
                        alt={formValue.title || "Oyun önizlemesi"}
                        className="h-full w-full object-cover"
                        src={formValue.coverImageUrl}
                      />
                    ) : (
                      <div className="h-full bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.35),transparent_35%),linear-gradient(135deg,#0f172a,#020617)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    {formValue.earlyAccess ? (
                      <span className="absolute left-4 top-4 rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white">
                        Erken Erişim
                      </span>
                    ) : null}
                    <button
                      className="absolute right-4 top-4 text-3xl text-white"
                      type="button"
                    >
                      ♡
                    </button>
                  </div>

                  <div className="space-y-3 p-4">
                    <h3 className="text-2xl font-bold text-white">
                      {formValue.title || "Oyun Başlığı"}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {formValue.genre || "Tür"} · {formValue.platform || "Platform"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formValue.releaseDate || "Çıkış Tarihi"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formValue.developer || "Geliştirici"} ·{" "}
                      {formValue.publisher || "Yayıncı"}
                    </p>
                    <p className="text-sm leading-6 text-slate-300">
                      {formValue.description ||
                        "This is a short description of the game that will appear on the game card."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                        {formValue.supportedLanguages || "EN"}
                      </span>
                      <div className="flex items-center gap-2">
                        {formValue.onSale ? (
                          <span className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-200">
                            -20%
                          </span>
                        ) : null}
                        <span className="text-lg font-bold text-white">$19.99</span>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white">Durum Kontrol Listesi</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Oyunu oluşturmadan önce bilgileri kontrol edin.
                </p>

                <div className="mt-5 space-y-3">
                  {checklist.map((item) => (
                    <div
                      className="flex items-center justify-between gap-4 text-sm"
                      key={item.label}
                    >
                      <span className="flex items-center gap-3 text-slate-200">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            item.complete
                              ? "bg-emerald-400"
                              : item.required
                                ? "bg-red-500"
                                : "bg-slate-500"
                          }`}
                        />
                        {item.label}
                      </span>
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                          item.complete
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : item.required
                              ? "border-red-400/30 bg-red-500/10 text-red-200"
                              : "border-white/10 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.complete
                          ? "Hazır"
                          : item.required
                            ? "Eksik"
                            : "İsteğe Bağlı"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameCreatePage;
