import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { Game } from "../types/gameTypes";

const galleryImages = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=500&q=80",
];

const relatedGames = [
  {
    title: "Starfall Odyssey",
    genre: "Aksiyon, Macera",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Galactic Rebirth",
    genre: "RYO, Strateji",
    rating: "4.4",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&q=80",
  },
  {
    title: "Voidwalkers",
    genre: "Aksiyon, Bilim Kurgu",
    rating: "4.5",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=120&q=80",
  },
];

const getGameIdFromPath = () => {
  const match = window.location.pathname.match(/^\/games\/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const splitTags = (value: string | null) => {
  return (
    value
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
};

const RequirementLine = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => {
  return (
    <div className="grid grid-cols-[28px_110px_1fr] items-start gap-3 text-sm">
      <span className="text-violet-400">{icon}</span>
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100">{value}</span>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  detail,
}: {
  detail?: string;
  icon: string;
  label: string;
  value: string;
}) => {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-6">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-3xl text-violet-300">
        {icon}
      </div>
      <div>
        <div className="text-sm text-slate-400">{label}</div>
        <div className="mt-1 text-xl font-bold text-white">{value}</div>
        {detail ? <div className="text-xs text-slate-500">{detail}</div> : null}
      </div>
    </div>
  );
};

const GameDetailPage = () => {
  const [gameId] = useState(() => getGameIdFromPath());
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(() => gameId !== null);
  const [error, setError] = useState<string | null>(() =>
    gameId ? null : "Geçersiz oyun id bilgisi."
  );
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const loadGame = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextGame = await gameService.getGameById(gameId);
        setGame(nextGame);
      } catch {
        setError("Oyun detayı yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    void loadGame();
  }, [gameId]);

  const genreTags = useMemo(() => splitTags(game?.genre ?? null), [game]);
  const languageTags = useMemo(
    () => splitTags(game?.supportedLanguages ?? null),
    [game]
  );
  const coverImage =
    game?.coverImageUrl ??
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=80";

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
        <GameNavbar activeItem="Games" />
        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <div className="h-[420px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
        </main>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
        <GameNavbar activeItem="Games" />
        <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[900px] place-items-center px-8 py-8">
          <section className="w-full rounded-3xl border border-red-400/20 bg-red-950/20 p-10 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/15 text-3xl text-red-200">
              !
            </div>
            <h1 className="text-2xl font-bold text-white">Oyun bulunamadı</h1>
            <p className="mt-3 text-sm text-red-100">
              {error ?? "Bu id ile eşleşen oyun kaydı bulunamadı."}
            </p>
            <a
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
              href="/games"
            >
              Oyunlara dön
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.13),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Games" />

        <main className="mx-auto max-w-[1840px] space-y-5 px-8 py-7">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <img
              alt={game.title}
              className="absolute inset-0 h-full w-full object-cover opacity-45"
              src={coverImage}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/78 to-slate-950/30" />

            <div className="relative grid gap-8 xl:grid-cols-[280px_1fr_380px]">
              <img
                alt={game.title}
                className="h-[310px] w-full rounded-2xl border border-white/15 object-cover shadow-2xl shadow-black/40"
                src={coverImage}
              />

              <div className="flex min-h-[310px] flex-col justify-center">
                <h1 className="text-4xl font-black tracking-tight text-white">
                  {game.title}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(genreTags.length > 0 ? genreTags : ["Oyun"]).map((tag) => (
                    <span
                      className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-100"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                  {game.earlyAccess ? (
                    <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                      Erken Erişim
                    </span>
                  ) : null}
                  {game.onSale ? (
                    <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                      İndirimde
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                  {game.description ?? "Bu oyun için açıklama bulunmuyor."}
                </p>

                <div className="mt-7 grid max-w-3xl gap-4 md:grid-cols-4">
                  <StatCard icon="★" label="Puan" value="4.7" />
                  <StatCard icon="↓" label="İndirme" value="125K" />
                  <StatCard
                    icon="▣"
                    label="Çıkış Tarihi"
                    value={formatDate(game.releaseDate)}
                  />
                  <StatCard
                    icon="♙"
                    label="Geliştirici"
                    value={game.developer ?? "Bilinmiyor"}
                  />
                </div>

                <div className="mt-7 flex flex-wrap gap-4">
                  <a
                    className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                    href={`/games/${game.id}`}
                  >
                    ▶ Hemen Oyna
                  </a>
                  <button
                    className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-7 text-base font-bold text-white"
                    type="button"
                  >
                    + Kütüphaneye Ekle
                  </button>
                  <button
                    className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-2xl text-white"
                    onClick={() => setFavorite((current) => !current)}
                    type="button"
                  >
                    {favorite ? "♥" : "♡"}
                  </button>
                </div>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                    Doğrulandı
                  </span>
                  <span className="rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-200">
                    Son Sürüm 1.2.0
                  </span>
                </div>

                <dl className="space-y-4">
                  <InfoRow label="Platform" value={game.platform ?? "Bilinmiyor"} />
                  <InfoRow label="Sürüm" value="Standart Sürüm" />
                  <InfoRow label="Tür" value={game.genre ?? "Bilinmiyor"} />
                  <InfoRow
                    label="Geliştirici"
                    value={game.developer ?? "Bilinmiyor"}
                  />
                  <InfoRow
                    label="Yayıncı"
                    value={game.publisher ?? "Bilinmiyor"}
                  />
                  <InfoRow
                    label="Çıkış Tarihi"
                    value={formatDate(game.releaseDate)}
                  />
                  <InfoRow
                    label="Dil"
                    value={game.supportedLanguages ?? "Bilinmiyor"}
                  />
                </dl>

                <div className="mt-5">
                  <div className="mb-2 text-sm text-slate-400">Etiketler</div>
                  <div className="flex flex-wrap gap-2">
                    {[...genreTags, ...languageTags.slice(0, 2)].map((tag) => (
                      <span
                        className="rounded-lg bg-violet-500/15 px-2 py-1 text-xs text-violet-100"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_2fr_1fr]">
            <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white">
                {game.title} Hakkında
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
                <p>
                  {game.description ??
                    "Bu oyun, LobbyTwoZero kütüphanesinde yer alan kapsamlı bir deneyim sunar."}
                </p>
                <p>
                  Oyuncular kendi ilerleme tarzlarını seçebilir, farklı sistemler
                  arasında geçiş yapabilir ve topluluk odaklı özelliklerden
                  faydalanabilir.
                </p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {[
                  "Geniş keşif ve ilerleme sistemi",
                  "Anlamlı seçimler ve tekrar oynanabilirlik",
                  "Topluluk odaklı oyun deneyimi",
                  "Sinema hissi veren atmosfer",
                ].map((item) => (
                  <li className="flex items-center gap-3" key={item}>
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-500/20 text-xs text-violet-200">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
                  <h2 className="mb-5 text-base font-bold text-white">
                    Minimum Gereksinimler
                  </h2>
                  <div className="space-y-4">
                    <RequirementLine icon="▣" label="OS" value="Windows 10 64-bit" />
                    <RequirementLine
                      icon="◌"
                      label="İşlemci"
                      value="Intel Core i5-8400 / AMD Ryzen 3 3300X"
                    />
                    <RequirementLine icon="▤" label="Bellek" value="8 GB RAM" />
                    <RequirementLine
                      icon="▥"
                      label="Grafik"
                      value={game.minimumSystemRequirements ?? "NVIDIA GTX 1060 6GB"}
                    />
                    <RequirementLine icon="◎" label="Depolama" value="50 GB" />
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
                  <h2 className="mb-5 text-base font-bold text-white">
                    Önerilen Gereksinimler
                  </h2>
                  <div className="space-y-4">
                    <RequirementLine icon="▣" label="OS" value="Windows 11 64-bit" />
                    <RequirementLine
                      icon="◌"
                      label="İşlemci"
                      value="Intel Core i7-10700K / AMD Ryzen 5 5600X"
                    />
                    <RequirementLine icon="▤" label="Bellek" value="16 GB RAM" />
                    <RequirementLine
                      icon="▥"
                      label="Grafik"
                      value={
                        game.recommendedSystemRequirements ??
                        "NVIDIA RTX 3060 Ti"
                      }
                    />
                    <RequirementLine icon="◎" label="Depolama" value="50 GB SSD" />
                  </div>
                </section>
              </div>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Medya Galerisi</h2>
                  <button
                    className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-100"
                    type="button"
                  >
                    Tümünü Gör
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  {[coverImage, ...galleryImages].slice(0, 5).map((image, index) => (
                    <div
                      className="relative h-32 overflow-hidden rounded-xl border border-white/10"
                      key={image}
                    >
                      <img
                        alt={`${game.title} medya ${index + 1}`}
                        className="h-full w-full object-cover"
                        src={image}
                      />
                      {index === 0 ? (
                        <div className="absolute inset-0 grid place-items-center bg-black/35">
                          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-slate-950">
                            ▶
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="grid gap-5">
              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
                <h2 className="mb-5 text-xl font-bold text-white">Oyun Bilgileri</h2>
                <dl className="space-y-3 text-sm">
                  {[
                    ["Tek Oyunculu", "Var"],
                    ["Çevrimiçi Çok Oyunculu", "Var"],
                    ["Çapraz Platform", "Var"],
                    ["Bulut Kayıt", "Var"],
                    ["Kontrolcü Desteği", "Tam"],
                    ["Başarımlar", "Var"],
                    ["Kartlar", "Yok"],
                  ].map(([label, value]) => (
                    <div className="flex justify-between gap-4" key={label}>
                      <dt className="text-slate-400">{label}</dt>
                      <dd className="font-medium text-slate-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Benzer Oyunlar</h2>
                  <a className="text-sm font-semibold text-violet-300" href="/games">
                    Tümü
                  </a>
                </div>
                <div className="space-y-4">
                  {relatedGames.map((relatedGame) => (
                    <article
                      className="flex items-center gap-3"
                      key={relatedGame.title}
                    >
                      <img
                        alt={relatedGame.title}
                        className="h-14 w-14 rounded-xl object-cover"
                        src={relatedGame.image}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-white">
                          {relatedGame.title}
                        </h3>
                        <p className="text-xs text-slate-400">{relatedGame.genre}</p>
                      </div>
                      <span className="text-sm text-amber-300">
                        ★ {relatedGame.rating}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          <section className="grid gap-5 rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl md:grid-cols-3">
            <StatCard icon="♕" label="Başarımlar" value="32 / 50" detail="%64 açıldı" />
            <StatCard icon="◷" label="Oynama Süresi" value="48s 32dk" />
            <StatCard icon="♙" label="Oyuncular" value="12.5K" detail="Aktif oyuncu" />
          </section>
        </main>
      </div>
    </div>
  );
};

export default GameDetailPage;
