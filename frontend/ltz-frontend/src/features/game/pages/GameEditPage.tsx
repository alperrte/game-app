import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { GAME_ROUTES } from "../../../lib/constants";
import { useAuthStore } from "../../../store/authStore";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { gameService } from "../services/gameService";
import type { Game, GameRequest } from "../types/gameTypes";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

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
    return "Güncelleme tarihi yok";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getGameEditErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    return ADMIN_ACTION_MESSAGE;
  }

  return fallback;
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
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [gameId] = useState(() => getGameIdFromPath());
  const [originalGame, setOriginalGame] = useState<Game | null>(null);
  const [initialForm, setInitialForm] = useState<EditGameForm | null>(null);
  const [formValue, setFormValue] = useState<EditGameForm | null>(null);
  const [initialLoading, setInitialLoading] = useState(() => gameId !== null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
        setError("Oyun bilgileri yüklenemedi.");
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
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (!gameId || !formValue) {
      return;
    }

    const request = normalizeGameRequest(formValue);

    if (!request.title) {
      setError("Başlık zorunludur.");
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
      setNotice("Değişiklikler başarıyla kaydedildi.");
    } catch (saveError) {
      setError(
        getGameEditErrorMessage(
          saveError,
          "Oyun güncellenemedi. Lütfen tekrar deneyin."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (initialForm) {
      setFormValue(initialForm);
      setNotice("Form son yüklenen oyun verisine sıfırlandı.");
      setError(null);
    }
  };

  const requestDelete = () => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (!gameId) {
      return;
    }

    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (!gameId) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      await gameService.deleteGame(gameId);
      setIsDeleteModalOpen(false);
      window.history.pushState({}, "", GAME_ROUTES.games);
      window.dispatchEvent(new Event("popstate"));
    } catch (deleteError) {
      setIsDeleteModalOpen(false);
      setError(
        getGameEditErrorMessage(
          deleteError,
          "Oyun silinemedi. Lütfen tekrar deneyin."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="relative bg-[#020817] text-white">
        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <div className="h-[680px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
        </main>
      </div>
    );
  }

  if (!formValue || !originalGame) {
    return (
      <div className="relative bg-[#020817] text-white">
        <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[900px] place-items-center px-8 py-8">
          <section className="w-full rounded-3xl border border-red-400/20 bg-red-950/20 p-10 text-center">
            <h1 className="text-2xl font-bold text-white">Oyun bulunamadı</h1>
            <p className="mt-3 text-sm text-red-100">
              {error ?? "Bu id ile eşleşen oyun kaydı yok."}
            </p>
            <a
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
              href={GAME_ROUTES.games}
            >
              Oyunlara dön
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">

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
                  Oyunu Düzenle
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Oyun detaylarını, medyayı ve ayarları güncelle.
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              Son güncelleme: {formatDateTime(originalGame.updatedAt)}
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
              <h2 className="text-xl font-bold text-white">Oyun Bilgileri</h2>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>Başlık</FieldLabel>
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
                  <FieldLabel required>Kısa URL</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("slug", event.target.value)}
                    value={formValue.slug}
                  />
                  <span className="text-xs text-slate-500">
                    URL uyumlu sürüm. Oyun sayfası bağlantılarında kullanılır.
                  </span>
                </label>
              </div>

              <label className="grid gap-2">
                  <FieldLabel required>Kısa Açıklama</FieldLabel>
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
                <FieldLabel required>Tam Açıklama</FieldLabel>
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
                  <FieldLabel required>Kategori</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("genre", event.target.value)}
                    value={formValue.genre ?? ""}
                  >
                    <option value="">Kategori seçin</option>
                    <option value="Action">Aksiyon</option>
                    <option value="RPG">RPG</option>
                    <option value="Simulation">Simülasyon</option>
                    <option value="Strategy">Strateji</option>
                    <option value="Racing">Yarış</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Alt Kategori</FieldLabel>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("subcategory", event.target.value)
                    }
                    value={formValue.subcategory}
                  >
                    <option value="Simulation">Simülasyon</option>
                    <option value="Open World">Açık Dünya</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Adventure">Macera</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>Geliştirici</FieldLabel>
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

                <label className="grid gap-2">
                  <FieldLabel required>Fiyat (USD)</FieldLabel>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("price", event.target.value)}
                    value={formValue.price}
                  />
                  <span className="text-xs text-slate-500">
                    Ücretsiz oyunlar için 0 kullanın.
                  </span>
                </label>

                <label className="grid gap-2 lg:col-span-2">
                  <FieldLabel required>Platformlar</FieldLabel>
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
                <h2 className="text-xl font-bold text-white">Oyun Medyası</h2>
                <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                  <label className="grid gap-2">
                    <FieldLabel required>Kapak Görseli</FieldLabel>
                    <input
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                      onChange={(event) =>
                        setField("coverImageUrl", event.target.value)
                      }
                      value={formValue.coverImageUrl ?? ""}
                    />
                  </label>

                  <div>
                    <FieldLabel>Galeri Görselleri</FieldLabel>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {formValue.galleryImages.map((image) => (
                        <img
                          alt="Galeri"
                          className="h-16 w-28 rounded-lg border border-white/10 object-cover"
                          key={image}
                          src={image}
                        />
                      ))}
                      <button
                        className="h-16 w-28 rounded-lg border border-dashed border-violet-400/40 text-sm font-semibold text-violet-200"
                        type="button"
                      >
                        + Görsel Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="mb-4 text-xl font-bold text-white">Mevcut Kapak</h2>
                {formValue.coverImageUrl ? (
                  <img
                    alt={formValue.title}
                    className="h-64 w-full rounded-2xl object-cover"
                    src={formValue.coverImageUrl}
                  />
                ) : (
                  <div className="grid h-64 place-items-center rounded-2xl bg-slate-900 text-slate-500">
                    Kapak görseli yok
                  </div>
                )}
                <button
                  className="mt-4 h-12 w-full rounded-xl border border-violet-400/40 text-sm font-bold text-violet-200"
                  type="button"
                >
                  Kapağı Değiştir
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="mb-5 text-xl font-bold text-white">Oyun Detayları</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailBadge
                    label="Durum"
                    value={formValue.onSale ? "İndirimde" : "Aktif"}
                  />
                  <DetailBadge label="Görünürlük" value="Herkese Açık" />
                  <DetailBadge
                    label="Erken Erişim"
                    value={formValue.earlyAccess ? "Evet" : "Hayır"}
                  />
                  <DetailBadge
                    label="İndirimde"
                    value={formValue.onSale ? "Evet" : "Hayır"}
                  />
                  <DetailBadge label="İndirim" value={formValue.onSale ? "20%" : "0%"} />
                  <DetailBadge
                    label="Oluşturulma"
                    value={formatDateTime(originalGame.createdAt)}
                  />
                  <DetailBadge
                    label="Son Güncelleme"
                    value={formatDateTime(originalGame.updatedAt)}
                  />
                </div>
              </section>

              {isAdmin ? (
                <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <h2 className="mb-5 text-xl font-bold text-white">İşlemler</h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:opacity-60"
                      disabled={submitting || deleting}
                      onClick={() => void handleSave()}
                      type="button"
                    >
                      {submitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </button>
                    <button
                      className="h-12 rounded-xl border border-white/10 bg-slate-900/80 px-6 text-sm font-bold text-white"
                      onClick={handleReset}
                      type="button"
                    >
                    Sıfırla
                    </button>
                    <button
                      className="h-12 rounded-xl border border-red-500/50 bg-red-500/10 px-6 text-sm font-bold text-red-200 disabled:opacity-60"
                      disabled={submitting || deleting}
                      onClick={requestDelete}
                      type="button"
                    >
                      {deleting ? "Siliniyor..." : "Oyunu Sil"}
                    </button>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-red-200">
                    Oyunu silmek kalıcıdır ve geri alınamaz. Bu işlem oyunu ve
                    ilişkili tüm verileri kaldırır.
                  </p>
                </section>
              ) : null}
            </aside>
          </div>
        </main>
      </div>
      <DeleteConfirmModal
        description="Oyunu silmek kalıcıdır ve geri alınamaz. Devam etmek istiyor musunuz?"
        isDeleting={deleting}
        isOpen={isDeleteModalOpen}
        itemName={formValue.title}
        onCancel={closeDeleteModal}
        onConfirm={() => {
          void confirmDelete();
        }}
        title="Oyunu Sil"
      />
    </div>
  );
};

export default GameEditPage;
