import { useEffect, useMemo, useState } from "react";
import { GAME_ROUTES } from "../../../lib/constants";
import GameCard from "../components/GameCard";
import GameFilterForm from "../components/GameFilterForm";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import type { Game } from "../types/gameTypes";
import type {
  GameListFilters,
  GameSortOption,
  GameViewMode,
} from "../components/GameFilterForm";

const mockGames: Game[] = [
  {
    id: 1001,
    title: "Eclipse Frontier",
    description: "Açık dünya uzay RYO'sunda bilinmeyeni keşfet.",
    genre: "Aksiyon, RYO",
    platform: "Windows",
    releaseDate: "2024-05-24",
    developer: "Nebula Forge",
    publisher: "LTZ Studios",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce, Türkçe",
    coverImageUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
    earlyAccess: true,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 91,
    createdAt: "2024-05-24T10:00:00",
    updatedAt: "2024-05-24T10:00:00",
  },
  {
    id: 1002,
    title: "Blood Oath",
    description: "Onur ve ihanet üzerine sert bir orta çağ macerası.",
    genre: "Aksiyon, Macera",
    platform: "Windows",
    releaseDate: "2024-04-10",
    developer: "Iron Vale",
    publisher: "Northmark",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: true,
    turkishLanguageSupport: false,
    popularityScore: 82,
    createdAt: "2024-04-10T10:00:00",
    updatedAt: "2024-04-10T10:00:00",
  },
  {
    id: 1003,
    title: "Cybernetica",
    description: "Distopik siberpunk gelecekte kendi imparatorluğunu kur.",
    genre: "RYO, Simülasyon",
    platform: "Windows, Steam",
    releaseDate: "2024-06-02",
    developer: "Neon Byte",
    publisher: "Circuit House",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 95,
    createdAt: "2024-06-02T10:00:00",
    updatedAt: "2024-06-02T10:00:00",
  },
  {
    id: 1004,
    title: "Forest Whisper",
    description: "Ormanın kalbinde sakin ama gizemli bir yolculuk.",
    genre: "Macera, Bağımsız",
    platform: "Windows",
    releaseDate: "2024-05-18",
    developer: "Mosslight",
    publisher: "Quiet Play",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce, Türkçe",
    coverImageUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: true,
    popularityScore: 77,
    createdAt: "2024-05-18T10:00:00",
    updatedAt: "2024-05-18T10:00:00",
  },
  {
    id: 1005,
    title: "Race Max Pro",
    description: "Etkileyici pistler ve gerçekçi fiziklerle yüksek tempolu yarış.",
    genre: "Yarış, Spor",
    platform: "Windows, PlayStation",
    releaseDate: "2024-05-05",
    developer: "Apex Drive",
    publisher: "Torque Media",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: true,
    turkishLanguageSupport: false,
    popularityScore: 88,
    createdAt: "2024-05-05T10:00:00",
    updatedAt: "2024-05-05T10:00:00",
  },
  {
    id: 1006,
    title: "Last Haven",
    description: "Kıyamet sonrası açık dünyada hayatta kal.",
    genre: "Hayatta Kalma",
    platform: "Windows",
    releaseDate: "2024-02-14",
    developer: "Haven Works",
    publisher: "Ashline",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    earlyAccess: true,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 74,
    createdAt: "2024-02-14T10:00:00",
    updatedAt: "2024-02-14T10:00:00",
  },
  {
    id: 1007,
    title: "Pixel Legends",
    description: "Modern dokunuşlara sahip retro piksel RYO macerası.",
    genre: "RYO, Bağımsız",
    platform: "Windows, Steam",
    releaseDate: "2024-01-30",
    developer: "Tiny Forge",
    publisher: "Pixel Bay",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 79,
    createdAt: "2024-01-30T10:00:00",
    updatedAt: "2024-01-30T10:00:00",
  },
  {
    id: 1008,
    title: "Starfall Tactics",
    description: "Filona komuta et ve galaksinin kaderi için savaş.",
    genre: "Strateji, Bilim Kurgu",
    platform: "Windows",
    releaseDate: "2024-04-27",
    developer: "Orbit Line",
    publisher: "Nova Press",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce, Türkçe",
    coverImageUrl:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: true,
    popularityScore: 83,
    createdAt: "2024-04-27T10:00:00",
    updatedAt: "2024-04-27T10:00:00",
  },
  {
    id: 1009,
    title: "Myth of Anatolia",
    description: "Mitlerle dolu bir diyarda kadim sırları ortaya çıkar.",
    genre: "Aksiyon, Macera",
    platform: "Windows",
    releaseDate: "2024-03-02",
    developer: "Anka Interactive",
    publisher: "LTZ Studios",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce, Türkçe",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 86,
    createdAt: "2024-03-02T10:00:00",
    updatedAt: "2024-03-02T10:00:00",
  },
  {
    id: 1010,
    title: "Neon Drift",
    description: "Neonlarla dolu gelecek şehrinde arcade yarış deneyimi.",
    genre: "Yarış, Arcade",
    platform: "Windows, Steam",
    releaseDate: "2024-06-01",
    developer: "Glowshift",
    publisher: "Arc Lane",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: true,
    turkishLanguageSupport: false,
    popularityScore: 90,
    createdAt: "2024-06-01T10:00:00",
    updatedAt: "2024-06-01T10:00:00",
  },
  {
    id: 1011,
    title: "Galactic Frontiers",
    description: "Bilinmeyeni keşfet, genişle ve fethet.",
    genre: "Strateji, Simülasyon",
    platform: "Windows",
    releaseDate: "2024-05-30",
    developer: "Deep Orbit",
    publisher: "Starpath",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce",
    coverImageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
    earlyAccess: true,
    onSale: false,
    turkishLanguageSupport: false,
    popularityScore: 84,
    createdAt: "2024-05-30T10:00:00",
    updatedAt: "2024-05-30T10:00:00",
  },
  {
    id: 1012,
    title: "Shadow's Fall",
    description: "Her seçimin önemli olduğu karanlık fantastik RYO.",
    genre: "Aksiyon, RYO",
    platform: "Windows",
    releaseDate: "2024-04-03",
    developer: "Nightglass",
    publisher: "Black Door",
    minimumSystemRequirements: null,
    recommendedSystemRequirements: null,
    supportedLanguages: "İngilizce, Türkçe",
    coverImageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    earlyAccess: false,
    onSale: false,
    turkishLanguageSupport: true,
    popularityScore: 89,
    createdAt: "2024-04-03T10:00:00",
    updatedAt: "2024-04-03T10:00:00",
  },
];

const initialFilters: GameListFilters = {
  earlyAccess: false,
  genre: "",
  onSale: false,
  platform: "",
  search: "",
  turkishLanguageSupport: false,
};

const getUniqueValues = (games: Game[], selector: (game: Game) => string | null) => {
  return Array.from(
    new Set(
      games
        .flatMap((game) => selector(game)?.split(",") ?? [])
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).sort();
};

const getGameTime = (game: Game) => {
  return new Date(game.releaseDate ?? game.createdAt).getTime();
};

const GamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filters, setFilters] = useState<GameListFilters>(initialFilters);
  const [sort, setSort] = useState<GameSortOption>("newest");
  const [viewMode, setViewMode] = useState<GameViewMode>("grid");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    gameService
      .getGames()
      .then((backendGames) => {
        if (!active) {
          return;
        }

        if (backendGames.length === 0) {
          setGames(mockGames);
          setNotice("Backend oyun döndürmedi, örnek veriler gösteriliyor.");
          return;
        }

        setGames(backendGames);
        setNotice(null);
      })
      .catch(() => {
        if (active) {
          setGames(mockGames);
          setNotice("Backend erişilebilir değil, örnek veriler gösteriliyor.");
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

  const genres = useMemo(() => getUniqueValues(games, (game) => game.genre), [games]);
  const platforms = useMemo(
    () => getUniqueValues(games, (game) => game.platform),
    [games]
  );

  const filteredGames = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return games
      .filter((game) => {
        const searchableText = [
          game.title,
          game.genre,
          game.platform,
          game.developer,
          game.publisher,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
          return false;
        }

        if (filters.genre && !game.genre?.includes(filters.genre)) {
          return false;
        }

        if (filters.platform && !game.platform?.includes(filters.platform)) {
          return false;
        }

        if (filters.earlyAccess && !game.earlyAccess) {
          return false;
        }

        if (filters.onSale && !game.onSale) {
          return false;
        }

        if (filters.turkishLanguageSupport && !game.turkishLanguageSupport) {
          return false;
        }

        return true;
      })
      .sort((leftGame, rightGame) => {
        if (sort === "popular") {
          return rightGame.popularityScore - leftGame.popularityScore;
        }

        if (sort === "oldest") {
          return getGameTime(leftGame) - getGameTime(rightGame);
        }

        return getGameTime(rightGame) - getGameTime(leftGame);
      });
  }, [filters, games, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleGames = filteredGames.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const updateFilters = (nextFilters: GameListFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const toggleFavorite = (gameId: number) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(gameId)
        ? currentIds.filter((id) => id !== gameId)
        : [...currentIds, gameId]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Games" />

        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300 shadow-2xl shadow-violet-950/40">
                ♘
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Oyunlar
                </h1>
                <p className="mt-3 text-base text-slate-400">
                  LobbyTwoZero platformundaki tüm oyunları yönet ve keşfet.
                </p>
              </div>
            </div>

            <a
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50 transition hover:from-violet-500 hover:to-indigo-500"
              href={GAME_ROUTES.createGame}
            >
              <span className="text-3xl font-light leading-none">+</span>
              Yeni Oyun Ekle
            </a>
          </section>

          <GameFilterForm
            filters={filters}
            genres={genres}
            onFiltersChange={updateFilters}
            onSortChange={(nextSort) => {
              setSort(nextSort);
              setPage(1);
            }}
            onViewModeChange={setViewMode}
            platforms={platforms}
            sort={sort}
            viewMode={viewMode}
          />

          {notice ? (
            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100">
              {notice}
            </div>
          ) : null}

          <section className="mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_22px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    className="h-80 animate-pulse rounded-2xl border border-white/10 bg-slate-900/70"
                    key={index}
                  />
                ))}
              </div>
            ) : null}

            {!loading && visibleGames.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-3xl text-violet-300">
                    ⌕
                  </div>
                  <h2 className="text-xl font-bold text-white">Oyun bulunamadı</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Arama, tür, platform veya hızlı filtreleri değiştirmeyi dene.
                  </p>
                </div>
              </div>
            ) : null}

            {!loading && visibleGames.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
                    : "grid gap-4"
                }
              >
                {visibleGames.map((game) => (
                  <GameCard
                    favorite={favoriteIds.includes(game.id)}
                    game={game}
                    key={game.id}
                    onToggleFavorite={toggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : null}

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 pb-1">
              <div className="flex items-center gap-2">
                <button
                  className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900/80 text-slate-300 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold ${
                        currentPage === pageNumber
                          ? "bg-violet-600 text-white"
                          : "text-slate-300 hover:bg-white/5"
                      }`}
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                {totalPages > 5 ? (
                  <span className="px-2 text-slate-500">...</span>
                ) : null}
                <button
                  className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900/80 text-slate-300 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  type="button"
                >
                  ›
                </button>
              </div>

              <label className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                <select
                  className="bg-transparent text-sm text-slate-200 outline-none"
                  onChange={(event) => {
                    setPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                  value={perPage}
                >
                  <option value={6}>Sayfa başına 6</option>
                  <option value={12}>Sayfa başına 12</option>
                  <option value={24}>Sayfa başına 24</option>
                </select>
              </label>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};

export default GamesPage;
