import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";

import GameNavbar from "../components/GameNavbar";
import { getExternalGamePlatforms } from "../services/externalGameService";
import { platformService } from "../services/platformService";
import type { ExternalGamePlatform } from "../types/externalGame.types";
import type { Platform, PlatformRequest } from "../types/platformTypes";
import { getErrorMessage } from "../../../utils/getErrorMessage";

type PlatformOrigin = "external" | "manual";
type PlatformSourceFilter = "all" | PlatformOrigin;
type PlatformFormMode = "create" | "edit";

type PlatformForm = {
  activeUsers: string;
  dataSource: string;
  description: string;
  developer: string;
  logoUrl: string;
  name: string;
  releaseYear: string;
  source: string;
  status: string;
  totalGames: string;
};

type PlatformRow = {
  id: number | null;
  activeUsers: string | null;
  createdAt: string | null;
  dataSource: string;
  description: string | null;
  developer: string;
  initials: string;
  logoUrl: string | null;
  name: string;
  origin: PlatformOrigin;
  releaseYear: number | null;
  rowKey: string;
  source: string;
  status: string;
  totalGames: number;
  updatedAt: string | null;
};

const initialForm: PlatformForm = {
  name: "",
  description: "",
  source: "",
  status: "ACTIVE",
  totalGames: "",
  activeUsers: "",
  releaseYear: "",
  developer: "",
  dataSource: "",
  logoUrl: "",
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const optionalNumber = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const normalizePlatformName = (name: string) => {
  return name.trim().toLocaleLowerCase("tr");
};

const normalizePlatformRequest = (value: PlatformForm): PlatformRequest => ({
  name: value.name.trim(),
  description: emptyToNull(value.description),
  source: emptyToNull(value.source),
  status: emptyToNull(value.status),
  totalGames: optionalNumber(value.totalGames),
  activeUsers: emptyToNull(value.activeUsers),
  releaseYear: optionalNumber(value.releaseYear),
  developer: emptyToNull(value.developer),
  dataSource: emptyToNull(value.dataSource),
  logoUrl: emptyToNull(value.logoUrl),
});

const toPlatformFormValue = (
  platform: Platform,
  fallback?: PlatformRow
): PlatformForm => ({
  name: platform.name,
  description: platform.description ?? "",
  source: platform.source ?? fallback?.source ?? "",
  status: platform.status ?? fallback?.status ?? "ACTIVE",
  totalGames:
    platform.totalGames !== undefined && platform.totalGames !== null
      ? String(platform.totalGames)
      : fallback
        ? String(fallback.totalGames)
        : "",
  activeUsers: platform.activeUsers ?? fallback?.activeUsers ?? "",
  releaseYear:
    platform.releaseYear !== undefined && platform.releaseYear !== null
      ? String(platform.releaseYear)
      : fallback?.releaseYear
        ? String(fallback.releaseYear)
        : "",
  developer: platform.developer ?? fallback?.developer ?? "",
  dataSource: platform.dataSource ?? fallback?.dataSource ?? "",
  logoUrl: platform.logoUrl ?? fallback?.logoUrl ?? "",
});

const getInitials = (name: string, fallback = "PF") => {
  const initials = name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || fallback;
};

const toExternalPlatformRow = (platform: ExternalGamePlatform): PlatformRow => ({
  id: null,
  activeUsers: platform.activeUsers,
  createdAt: null,
  dataSource: platform.dataSource,
  description: platform.description,
  developer: platform.developer,
  initials: getInitials(platform.name, platform.source.charAt(0)),
  logoUrl: platform.logoUrl ?? null,
  name: platform.name,
  origin: "external",
  releaseYear: platform.releaseYear,
  rowKey: `external-${platform.source}-${normalizePlatformName(platform.name)}`,
  source: platform.source,
  status: platform.status,
  totalGames: platform.totalGames,
  updatedAt: null,
});

const toManualPlatformRow = (
  platform: Platform,
  externalPlatform?: PlatformRow
): PlatformRow => ({
  id: platform.id,
  activeUsers: platform.activeUsers ?? externalPlatform?.activeUsers ?? null,
  createdAt: platform.createdAt,
  dataSource: platform.dataSource ?? externalPlatform?.dataSource ?? "Backend",
  description: platform.description,
  developer: platform.developer ?? externalPlatform?.developer ?? "Manual",
  initials: getInitials(platform.name),
  logoUrl: platform.logoUrl ?? externalPlatform?.logoUrl ?? null,
  name: platform.name,
  origin: "manual",
  releaseYear: platform.releaseYear ?? externalPlatform?.releaseYear ?? null,
  rowKey: `manual-${platform.id}`,
  source: platform.source ?? externalPlatform?.source ?? "MANUAL",
  status: platform.status ?? externalPlatform?.status ?? "ACTIVE",
  totalGames: platform.totalGames ?? externalPlatform?.totalGames ?? 0,
  updatedAt: platform.updatedAt,
});

const mergePlatformRows = (
  externalPlatforms: ExternalGamePlatform[],
  manualPlatforms: Platform[]
) => {
  const rowsByName = new Map<string, PlatformRow>();

  externalPlatforms.forEach((platform) => {
    rowsByName.set(normalizePlatformName(platform.name), toExternalPlatformRow(platform));
  });

  manualPlatforms.forEach((platform) => {
    const key = normalizePlatformName(platform.name);
    rowsByName.set(key, toManualPlatformRow(platform, rowsByName.get(key)));
  });

  return Array.from(rowsByName.values()).sort((leftPlatform, rightPlatform) =>
    leftPlatform.name.localeCompare(rightPlatform.name, "tr")
  );
};

const getFormErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      return "Bu işlem için yetkiniz yok veya oturumunuz sona ermiş olabilir.";
    }

    if (status === 409) {
      return "Bu platform zaten mevcut.";
    }
  }

  return fallback;
};

const normalizeStatus = (status: string) => status.trim().toUpperCase();

const statusBadgeClass = (status: string) => {
  return normalizeStatus(status) === "ACTIVE"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-red-400/20 bg-red-500/15 text-red-200";
};

const originBadgeClass = (origin: PlatformOrigin) => {
  return origin === "external"
    ? "border-sky-400/20 bg-sky-500/15 text-sky-200"
    : "border-emerald-400/20 bg-emerald-500/15 text-emerald-200";
};

const originLabel = (origin: PlatformOrigin) => {
  return origin === "external" ? "Harici" : "Manuel";
};

const formatActiveUsers = (activeUsers: string | null) => {
  return activeUsers?.trim() || "N/A";
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

const PlatformAvatar = ({ platform }: { platform: PlatformRow }) => {
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
          {platform.initials}
        </div>
      )}
    </div>
  );
};

const GamePlatformsPage = () => {
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformRow | null>(
    null
  );
  const [formValue, setFormValue] = useState<PlatformForm>(initialForm);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<PlatformSourceFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEditKey, setLoadingEditKey] = useState<string | null>(null);
  const [deletingPlatformKey, setDeletingPlatformKey] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<PlatformFormMode>("create");
  const [editingPlatformId, setEditingPlatformId] = useState<number | null>(
    null
  );

  const setNextPlatforms = (
    nextPlatforms: PlatformRow[],
    selectFirst: boolean
  ) => {
    setPlatforms(nextPlatforms);
    setSelectedPlatform((currentPlatform) => {
      if (!selectFirst) {
        return null;
      }

      if (!currentPlatform) {
        return nextPlatforms[0] ?? null;
      }

      return (
        nextPlatforms.find(
          (platform) => platform.rowKey === currentPlatform.rowKey
        ) ??
        nextPlatforms[0] ??
        null
      );
    });
  };

  const loadPlatforms = async (selectFirst = true) => {
    setLoading(true);
    setError(null);

    const [externalPlatformsResult, manualPlatformsResult] =
      await Promise.allSettled([
        getExternalGamePlatforms(),
        platformService.getPlatforms(),
      ]);

    const externalPlatforms =
      externalPlatformsResult.status === "fulfilled"
        ? externalPlatformsResult.value
        : [];
    const manualPlatforms =
      manualPlatformsResult.status === "fulfilled"
        ? manualPlatformsResult.value
        : [];
    const nextPlatforms = mergePlatformRows(externalPlatforms, manualPlatforms);

    setNextPlatforms(nextPlatforms, selectFirst);

    if (
      externalPlatformsResult.status === "rejected" &&
      manualPlatformsResult.status === "rejected"
    ) {
      setError(
        getErrorMessage(
          externalPlatformsResult.reason,
          "Platformlar yüklenirken bir hata oluştu."
        )
      );
    } else if (externalPlatformsResult.status === "rejected") {
      setError(
        getErrorMessage(
          externalPlatformsResult.reason,
          "Harici platformlar yüklenemedi; manuel platformlar gösteriliyor."
        )
      );
    } else if (manualPlatformsResult.status === "rejected") {
      setError(
        getErrorMessage(
          manualPlatformsResult.reason,
          "Manuel platformlar yüklenemedi; harici platformlar gösteriliyor."
        )
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadPlatforms();
  }, []);

  const stats = useMemo(() => {
    const manualPlatforms = platforms.filter(
      (platform) => platform.origin === "manual"
    ).length;
    const externalPlatforms = platforms.length - manualPlatforms;
    const totalGames = platforms.reduce(
      (total, platform) => total + platform.totalGames,
      0
    );

    return {
      externalPlatforms,
      manualPlatforms,
      totalGames,
      totalPlatforms: platforms.length,
    };
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr");

    return platforms.filter((platform) => {
      const searchableText = [
        platform.name,
        platform.source,
        platform.developer,
        platform.description,
        platform.dataSource,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesSource =
        sourceFilter === "all" || platform.origin === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [platforms, search, sourceFilter]);

  const openCreateModal = () => {
    setFormValue(initialForm);
    setFormError(null);
    setFormMode("create");
    setEditingPlatformId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
    setFormValue(initialForm);
    setFormMode("create");
    setEditingPlatformId(null);
    setSaving(false);
  };

  const openEditModal = async (platform: PlatformRow) => {
    if (platform.id === null) {
      setNotice("Harici platformlar düzenlenemez.");
      return;
    }

    setLoadingEditKey(platform.rowKey);
    setFormError(null);
    setNotice(null);

    try {
      const manualPlatform = await platformService.getPlatformById(platform.id);

      setSelectedPlatform({
        ...platform,
        description: manualPlatform.description,
        name: manualPlatform.name,
      });
      setFormValue(toPlatformFormValue(manualPlatform, platform));
      setFormMode("edit");
      setEditingPlatformId(manualPlatform.id);
      setIsModalOpen(true);
    } catch (editLoadError) {
      setError(
        getErrorMessage(
          editLoadError,
          "Platform bilgileri yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoadingEditKey(null);
    }
  };

  const setField = <TKey extends keyof PlatformForm>(
    key: TKey,
    value: PlatformForm[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const handleSavePlatform = async () => {
    const request = normalizePlatformRequest(formValue);

    if (!request.name) {
      setFormError("Platform adı zorunludur.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (formMode === "edit") {
        if (editingPlatformId === null) {
          setFormError("Düzenlenecek platform bulunamadı.");
          return;
        }

        await platformService.updatePlatform(editingPlatformId, request);
      } else {
        await platformService.createPlatform(request);
      }

      closeModal();
      setNotice(
        formMode === "edit"
          ? "Platform başarıyla güncellendi."
          : "Platform başarıyla eklendi."
      );
      await loadPlatforms(false);
    } catch (saveError) {
      setFormError(
        getFormErrorMessage(
          saveError,
          formMode === "edit"
            ? "Platform güncellenirken bir hata oluştu."
            : "Platform eklenirken bir hata oluştu."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlatform = async (platform: PlatformRow) => {
    if (platform.id === null) {
      setNotice("Harici platformlar silinemez.");
      return;
    }

    const confirmed = window.confirm(
      `${platform.name} platformunu silmek istediğinizden emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    const wasSelectedPlatform = selectedPlatform?.rowKey === platform.rowKey;

    setDeletingPlatformKey(platform.rowKey);
    setError(null);
    setNotice(null);

    try {
      await platformService.deletePlatform(platform.id);

      if (wasSelectedPlatform) {
        setSelectedPlatform(null);
      }

      await loadPlatforms(!wasSelectedPlatform);
      setNotice("Platform başarıyla silindi.");
    } catch (deleteError) {
      setError(
        getFormErrorMessage(deleteError, "Platform silinirken bir hata oluştu.")
      );
    } finally {
      setDeletingPlatformKey(null);
    }
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
                Harici Steam/Epic platformlarını ve manuel platformları birlikte
                görüntüle.
              </p>
            </div>

            <button
              className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
              onClick={openCreateModal}
              type="button"
            >
              <span className="text-3xl font-light leading-none">+</span>
              Add Platform
            </button>
          </section>

          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Harici + manuel"
              icon="P"
              label="Total Platforms"
              value={String(stats.totalPlatforms)}
            />
            <StatCard
              accent="bg-sky-500/15 text-sky-300"
              helper="Steam/Epic provider verisi"
              icon="H"
              label="External Platforms"
              value={String(stats.externalPlatforms)}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="POST /games/platforms kayıtları"
              icon="M"
              label="Manual Platforms"
              value={String(stats.manualPlatforms)}
            />
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Harici provider toplamı"
              icon="G"
              label="Total Games"
              value={stats.totalGames.toLocaleString("en")}
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
                className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                onChange={(event) =>
                  setSourceFilter(event.target.value as PlatformSourceFilter)
                }
                value={sourceFilter}
              >
                <option value="all">All Sources</option>
                <option value="external">External</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {notice ? (
              <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
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
                  Platformlar yükleniyor...
                </div>
              ) : null}

              {!loading && filteredPlatforms.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Platform bulunamadı.
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Harici veya manuel platform verisi dönmedi ya da filtreler
                      eşleşmedi.
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
                        <th className="px-5 py-4">Source</th>
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
                          className={`border-b border-white/10 hover:bg-white/[0.03] ${
                            selectedPlatform?.rowKey === platform.rowKey
                              ? "outline outline-1 outline-violet-500"
                              : ""
                          }`}
                          key={platform.rowKey}
                        >
                          <td className="px-5 py-4">
                            <button
                              className="flex cursor-pointer items-center gap-4 text-left"
                              onClick={() => setSelectedPlatform(platform)}
                              type="button"
                            >
                              <PlatformAvatar platform={platform} />
                              <div>
                                <span className="font-bold text-white">
                                  {platform.name}
                                </span>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {platform.source}
                                </p>
                              </div>
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg border px-3 py-1 text-xs font-bold ${originBadgeClass(
                                platform.origin
                              )}`}
                            >
                              {originLabel(platform.origin)}
                            </span>
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
                            {platform.releaseYear ?? "N/A"}
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
                                className="cursor-pointer rounded-lg border border-violet-400/30 px-3 py-2 text-xs font-bold text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                  platform.id === null ||
                                  loadingEditKey === platform.rowKey ||
                                  deletingPlatformKey === platform.rowKey
                                }
                                onClick={() => {
                                  void openEditModal(platform);
                                }}
                                type="button"
                              >
                                {loadingEditKey === platform.rowKey
                                  ? "Yükleniyor..."
                                  : "Seç"}
                              </button>
                              <button
                                className="cursor-pointer rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                  platform.id === null ||
                                  deletingPlatformKey === platform.rowKey ||
                                  loadingEditKey === platform.rowKey
                                }
                                onClick={() => {
                                  void handleDeletePlatform(platform);
                                }}
                                type="button"
                              >
                                {deletingPlatformKey === platform.rowKey
                                  ? "Siliniyor..."
                                  : "Sil"}
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

            {selectedPlatform ? (
              <aside className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-center gap-4">
                  <PlatformAvatar platform={selectedPlatform} />
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {selectedPlatform.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {selectedPlatform.id
                        ? `Platform ID: ${selectedPlatform.id}`
                        : selectedPlatform.source}
                    </p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {selectedPlatform.description || "Açıklama yok."}
                </p>
                <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-slate-400">Source</dt>
                    <dd>{originLabel(selectedPlatform.origin)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Total Games</dt>
                    <dd>{selectedPlatform.totalGames}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Developer</dt>
                    <dd>{selectedPlatform.developer}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Data Source</dt>
                    <dd>{selectedPlatform.dataSource}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Created</dt>
                    <dd>{formatDate(selectedPlatform.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Updated</dt>
                    <dd>
                      {formatDate(
                        selectedPlatform.updatedAt ?? selectedPlatform.createdAt
                      )}
                    </dd>
                  </div>
                </dl>
              </aside>
            ) : null}
          </section>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {formMode === "edit" ? "Edit Platform" : "Add Platform"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {formMode === "edit"
                    ? "Backend API ile manuel platform kaydını güncelle."
                    : "Backend API ile yeni manuel platform kaydı oluştur."}
                </p>
              </div>
              <button
                aria-label="Close modal"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/5 text-xl text-slate-400 hover:bg-white/10"
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
                void handleSavePlatform();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Platform Name
                </span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={100}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Enter platform name..."
                  required
                  value={formValue.name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Description</span>
                <textarea
                  className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={500}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Describe this platform..."
                  value={formValue.description ?? ""}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Source</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={100}
                    onChange={(event) => setField("source", event.target.value)}
                    placeholder="STEAM, EPIC, MANUAL..."
                    value={formValue.source}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Status</span>
                  <select
                    className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) => setField("status", event.target.value)}
                    value={formValue.status}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Total Games
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    inputMode="numeric"
                    onChange={(event) =>
                      setField("totalGames", event.target.value)
                    }
                    placeholder="0"
                    value={formValue.totalGames}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Active Users
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={100}
                    onChange={(event) =>
                      setField("activeUsers", event.target.value)
                    }
                    placeholder="N/A, 10M+..."
                    value={formValue.activeUsers}
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
                      setField("releaseYear", event.target.value)
                    }
                    placeholder="2003"
                    value={formValue.releaseYear}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Developer</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("developer", event.target.value)
                    }
                    placeholder="Valve, Epic Games..."
                    value={formValue.developer}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Data Source
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={150}
                    onChange={(event) =>
                      setField("dataSource", event.target.value)
                    }
                    placeholder="Backend, Steam API..."
                    value={formValue.dataSource}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Logo URL</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) => setField("logoUrl", event.target.value)}
                    placeholder="https://example.com/logo.png"
                    value={formValue.logoUrl}
                  />
                </label>
              </div>

              {formError ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving || !formValue.name.trim()}
                  type="submit"
                >
                  {saving
                    ? "Kaydediliyor..."
                    : formMode === "edit"
                      ? "Update Platform"
                      : "Create Platform"}
                </button>
                <button
                  className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white"
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
