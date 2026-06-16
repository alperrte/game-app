import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { getErrorMessage } from "../../../utils/getErrorMessage";
import { getExternalGameDetail } from "../services/externalGameService";
import { gameService } from "../services/gameService";
import type {
  ExternalGameDetailResponse,
  GameSource,
} from "../types/externalGame.types";
import type { Game } from "../types/gameTypes";
import { getExternalGameImageUrl } from "../utils/steamImage";

type DetailGame = ExternalGameDetailResponse | Game;

type RequirementRow = {
  label: string | null;
  value: string;
};

const requirementLabels = [
  "Operating System",
  "Additional Notes",
  "Sound Card",
  "Video Card",
  "Hard Drive",
  "İşletim Sistemi",
  "Isletim Sistemi",
  "Ekran Kartı",
  "Ekran Karti",
  "Ses Kartı",
  "Ses Karti",
  "Ek Notlar",
  "Processor",
  "Graphics",
  "Storage",
  "Network",
  "Memory",
  "DirectX",
  "Notes",
  "İşlemci",
  "Islemci",
  "Bellek",
  "Depolama",
  "Notlar",
  "CPU",
  "GPU",
  "RAM",
  "OS",
  "Ağ",
  "Ag",
];

const requirementLabelPattern = requirementLabels
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

const requirementLabelRegex = new RegExp(
    `(${requirementLabelPattern})\\s*:`,
    "gi"
);

const isGameSource = (value: string | undefined): value is GameSource => {
  return value === "STEAM" || value === "EPIC";
};

const isExternalDetailGame = (
    game: DetailGame
): game is ExternalGameDetailResponse => {
  return "externalId" in game;
};

const getDetailErrorMessage = (error: unknown, isExternalDetail: boolean) => {
  if (isAxiosError(error) && error.response?.status === 501) {
    return "Bu oyun kaynağı henüz aktif değil.";
  }

  return getErrorMessage(
      error,
      isExternalDetail
          ? "Harici oyun detayı yüklenirken bir hata oluştu."
          : "Oyun detayı yüklenirken bir hata oluştu."
  );
};

const splitTags = (value: string | null | undefined) => {
  return (
      value
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) ?? []
  );
};

const toDisplayText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const stringValue = String(value);

  const normalizedValue = stringValue
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<\/(li|p|div|tr|h[1-6])>/gi, "\n")
      .replace(/<\/?(ul|ol|strong|b|em|i|span)[^>]*>/gi, "");

  const parsedDocument = new DOMParser().parseFromString(
      normalizedValue,
      "text/html"
  );

  return parsedDocument.body.textContent?.trim() || stringValue.trim();
};

const normalizeRequirementLabel = (label: string) => {
  const normalizedLabel = label
      .trim()
      .replace(/^[-•*]\s*/, "")
      .toLocaleLowerCase("tr-TR");

  if (
      [
        "os",
        "operating system",
        "işletim sistemi",
        "isletim sistemi",
      ].includes(normalizedLabel)
  ) {
    return "İşletim Sistemi";
  }

  if (["processor", "cpu", "işlemci", "islemci"].includes(normalizedLabel)) {
    return "İşlemci";
  }

  if (["memory", "ram", "bellek"].includes(normalizedLabel)) {
    return "Bellek";
  }

  if (
      [
        "graphics",
        "gpu",
        "video card",
        "ekran kartı",
        "ekran karti",
      ].includes(normalizedLabel)
  ) {
    return "Ekran Kartı";
  }

  if (["storage", "hard drive", "depolama"].includes(normalizedLabel)) {
    return "Depolama";
  }

  if (normalizedLabel === "directx") {
    return "DirectX";
  }

  if (["network", "ağ", "ag"].includes(normalizedLabel)) {
    return "Ağ";
  }

  if (["sound card", "ses kartı", "ses karti"].includes(normalizedLabel)) {
    return "Ses Kartı";
  }

  if (
      ["additional notes", "notes", "ek notlar", "notlar"].includes(
          normalizedLabel
      )
  ) {
    return "Ek Notlar";
  }

  return label.trim();
};

const normalizeRequirementText = (requirementText: string | null | undefined) => {
  const displayText = toDisplayText(requirementText);

  if (!displayText) {
    return null;
  }

  return displayText
      .replace(/\r/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .replace(/\bminimum\s*:\s*/gi, "")
      .replace(/\brecommended\s*:\s*/gi, "")
      .replace(/\bönerilen\s*:\s*/gi, "")
      .replace(
          /requires a 64-bit processor and operating system\.?/gi,
          "64-bit işlemci ve işletim sistemi gerektirir"
      )
      .trim();
};

const cleanRequirementValue = (value: string) => {
  return value
      .replace(/^[:\s\-•*]+/, "")
      .replace(/\s+/g, " ")
      .trim();
};

const parseSystemRequirementRows = (text: string): RequirementRow[] => {
  const matches = Array.from(text.matchAll(requirementLabelRegex));

  if (matches.length === 0) {
    return text
        .split(/\n+|;\s*|\.\s+(?=[A-ZÇĞİÖŞÜ])/)
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map((value) => ({
          label: null,
          value,
        }));
  }

  const rows: RequirementRow[] = [];

  const firstMatchIndex = matches[0].index ?? 0;
  const introText = cleanRequirementValue(text.slice(0, firstMatchIndex));

  if (introText) {
    rows.push({
      label: null,
      value: introText,
    });
  }

  matches.forEach((match, index) => {
    const rawLabel = match[1];
    const matchIndex = match.index ?? 0;
    const valueStartIndex = matchIndex + match[0].length;
    const nextMatchIndex =
        index + 1 < matches.length
            ? matches[index + 1].index ?? text.length
            : text.length;

    const value = cleanRequirementValue(
        text.slice(valueStartIndex, nextMatchIndex)
    );

    if (!rawLabel || !value) {
      return;
    }

    rows.push({
      label: normalizeRequirementLabel(rawLabel),
      value,
    });
  });

  return rows;
};

const formatSystemRequirements = (
    requirementText: string | null | undefined
): RequirementRow[] => {
  const normalizedText = normalizeRequirementText(requirementText);

  if (!normalizedText) {
    return [];
  }

  return parseSystemRequirementRows(normalizedText);
};

const Badge = ({
                 children,
                 tone,
               }: {
  children: ReactNode;
  tone: "cyan" | "emerald" | "rose" | "violet";
}) => {
  const classes = {
    cyan: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
    emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    rose: "border-rose-400/30 bg-rose-500/15 text-rose-100",
    violet: "border-violet-400/30 bg-violet-500/15 text-violet-100",
  };

  return (
      <span
          className={`rounded-lg border px-3 py-1 text-xs font-semibold ${classes[tone]}`}
      >
      {children}
    </span>
  );
};

const InfoRow = ({
                   label,
                   value,
                 }: {
  label: string;
  value: string | number | null | undefined;
}) => {
  return (
      <div className="grid grid-cols-[150px_1fr] gap-4 text-sm">
        <dt className="text-slate-400">{label}</dt>
        <dd className="font-medium text-slate-100">
          {toDisplayText(value) || "Bilinmiyor"}
        </dd>
      </div>
  );
};

const TextBlock = ({
                     title,
                     value,
                   }: {
  title: string;
  value: string | null | undefined;
}) => {
  return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {toDisplayText(value) || "Bilgi bulunmuyor."}
        </p>
      </section>
  );
};

const RequirementBlock = ({
                            title,
                            value,
                          }: {
  title: string;
  value: string | null | undefined;
}) => {
  const requirementRows = formatSystemRequirements(value);

  return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Sistem Gereksinimleri
            </p>
            <h2 className="mt-2 text-xl font-black text-white">{title}</h2>
          </div>

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/15 text-lg font-black text-violet-100">
            PC
          </div>
        </div>

        {requirementRows.length > 0 ? (
            <div className="space-y-2">
              {requirementRows.map((row, index) => (
                  <div
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-200"
                      key={`${row.label ?? "requirement"}-${index}`}
                  >
                    {row.label ? (
                        <>
                  <span className="font-black text-violet-100">
                    {row.label}:{" "}
                  </span>
                          <span className="break-words text-slate-200">
                    {row.value}
                  </span>
                        </>
                    ) : (
                        <span className="break-words font-semibold text-slate-100">
                  {row.value}
                </span>
                    )}
                  </div>
              ))}
            </div>
        ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-300">
              Bilgi bulunamadı.
            </div>
        )}
      </section>
  );
};

const GameDetailPage = () => {
  const { id, source, externalId } = useParams();

  const isExternalRoute = source !== undefined || externalId !== undefined;
  const backendGameId = id ? Number(id) : null;

  const routeError = isExternalRoute
      ? !isGameSource(source) || !externalId
          ? "Geçersiz oyun kaynağı veya oyun id bilgisi."
          : null
      : !backendGameId || Number.isNaN(backendGameId)
          ? "Geçersiz oyun id bilgisi."
          : null;

  const [game, setGame] = useState<DetailGame | null>(null);
  const [loading, setLoading] = useState(() => routeError === null);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (routeError) {
      return;
    }

    let active = true;

    const loadGame = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextGame =
            isExternalRoute && isGameSource(source) && externalId
                ? await getExternalGameDetail(source, externalId)
                : await gameService.getGameById(backendGameId as number);

        if (active) {
          setImageFailed(false);
          setGame(nextGame);
        }
      } catch (detailError) {
        if (active) {
          setGame(null);
          setError(getDetailErrorMessage(detailError, isExternalRoute));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadGame();

    return () => {
      active = false;
    };
  }, [backendGameId, externalId, isExternalRoute, routeError, source]);

  const genreTags = useMemo(() => splitTags(game?.genre ?? null), [game]);

  const languageTags = useMemo(
      () => splitTags(game?.supportedLanguages ?? null),
      [game]
  );

  const visibleError = routeError ?? error;

  const detailImageUrl =
      game && !imageFailed
          ? isExternalDetailGame(game)
              ? getExternalGameImageUrl({
                coverImageUrl: game.coverImageUrl,
                externalId: game.externalId,
                source: game.source,
              })
              : game.coverImageUrl?.trim() || null
          : null;

  const steamStoreUrl =
      game && isExternalDetailGame(game) && game.source === "STEAM"
          ? `https://store.steampowered.com/app/${game.externalId}`
          : null;

  if (visibleError) {
    return (
        <div className="relative bg-[#020817] text-white">
          <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[900px] place-items-center px-8 py-8">
            <section className="w-full rounded-3xl border border-red-400/20 bg-red-950/20 p-10 text-center">
              <h1 className="text-2xl font-bold text-white">
                Oyun detayı alınamadı
              </h1>

              <p className="mt-3 text-sm text-red-100">{visibleError}</p>

              <Link
                  className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
                  to="/games"
              >
                Oyunlara dön
              </Link>
            </section>
          </main>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="relative bg-[#020817] text-white">
          <main className="mx-auto max-w-[1840px] px-8 py-8">
            <div className="h-[420px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
          </main>
        </div>
    );
  }

  if (!game) {
    return (
        <div className="relative bg-[#020817] text-white">
          <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[900px] place-items-center px-8 py-8">
            <section className="w-full rounded-3xl border border-red-400/20 bg-red-950/20 p-10 text-center">
              <h1 className="text-2xl font-bold text-white">Oyun bulunamadı</h1>

              <p className="mt-3 text-sm text-red-100">
                Bu oyun için detay bilgisi bulunamadı.
              </p>

              <Link
                  className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
                  to="/games"
              >
                Oyunlara dön
              </Link>
            </section>
          </main>
        </div>
    );
  }

  return (
      <div className="relative bg-[#020817] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.13),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

        <div className="relative min-h-screen">
          <main className="mx-auto max-w-[1840px] space-y-5 px-8 py-7">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {detailImageUrl ? (
                  <img
                      alt={game.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-35"
                      src={detailImageUrl}
                  />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/35" />

              <div className="relative grid gap-8 xl:grid-cols-[460px_1fr_420px]">
                {detailImageUrl ? (
                    <img
                        alt={game.title}
                        className="aspect-[460/215] w-full rounded-2xl border border-white/15 bg-slate-950 object-contain shadow-2xl shadow-black/40"
                        onError={() => setImageFailed(true)}
                        src={detailImageUrl}
                    />
                ) : (
                    <div className="grid aspect-[460/215] w-full place-items-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 text-sm text-slate-400">
                      Kapak görseli yok
                    </div>
                )}

                <div className="flex min-h-[360px] flex-col justify-center">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge tone="cyan">{game.source}</Badge>

                    {game.turkishLanguageSupport ? (
                        <Badge tone="rose">Türkçe dil desteği</Badge>
                    ) : null}

                    {game.earlyAccess ? (
                        <Badge tone="violet">Erken erişim</Badge>
                    ) : null}

                    {game.onSale ? <Badge tone="emerald">İndirimde</Badge> : null}
                  </div>

                  <h1 className="text-4xl font-black tracking-tight text-white">
                    {game.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(genreTags.length > 0 ? genreTags : ["Oyun"]).map((tag) => (
                        <Badge key={tag} tone="violet">
                          {tag}
                        </Badge>
                    ))}
                  </div>

                  <p className="mt-5 max-w-4xl text-base leading-7 text-slate-300">
                    {toDisplayText(game.description) ||
                        "Bu oyun için açıklama bulunmuyor."}
                  </p>

                  {steamStoreUrl ? (
                      <a
                          className="mt-6 inline-flex w-fit cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/40 transition hover:scale-[1.02] hover:from-emerald-400 hover:to-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                          href={steamStoreUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                      >
                        Oyunu Satın Al
                      </a>
                  ) : null}
                </div>

                <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
                  <h2 className="mb-5 text-xl font-bold text-white">
                    Oyun Bilgileri
                  </h2>

                  <dl className="space-y-4">
                    <InfoRow label="Tür" value={game.genre} />
                    <InfoRow label="Platform" value={game.platform} />
                    <InfoRow label="Çıkış tarihi" value={game.releaseDate} />
                    <InfoRow label="Geliştirici" value={game.developer} />
                    <InfoRow label="Yayıncı" value={game.publisher} />
                    <InfoRow label="Kaynak" value={game.source} />

                    {!isExternalDetailGame(game) ? (
                        <>
                          <InfoRow label="Oyun ID" value={game.id} />
                          <InfoRow label="Kategori" value={game.categoryName} />
                        </>
                    ) : null}
                  </dl>

                  <div className="mt-6">
                    <div className="mb-2 text-sm text-slate-400">
                      Desteklenen diller
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(languageTags.length > 0
                              ? languageTags
                              : ["Bilinmiyor"]
                      ).map((tag) => (
                          <span
                              className="rounded-lg bg-cyan-500/15 px-2 py-1 text-xs text-cyan-100"
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

            <div className="grid gap-5 xl:grid-cols-2">
              <RequirementBlock
                  title="Minimum Sistem Gereksinimleri"
                  value={game.minimumSystemRequirements}
              />

              <RequirementBlock
                  title="Önerilen Sistem Gereksinimleri"
                  value={game.recommendedSystemRequirements}
              />
            </div>

            <TextBlock title="Desteklenen diller" value={game.supportedLanguages} />
          </main>
        </div>
      </div>
  );
};

export default GameDetailPage;