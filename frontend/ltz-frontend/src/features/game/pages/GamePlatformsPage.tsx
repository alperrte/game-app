import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { getExternalGamePlatforms } from "../services/externalGameService";
import { platformService } from "../services/platformService";
import type { ExternalGamePlatform } from "../types/externalGame.types";
import type { Platform, PlatformRequest } from "../types/platformTypes";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

type PlatformStatusFilter = "all" | "ACTIVE" | "INACTIVE";
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

type PlatformRow = Platform & {
  activeUsers: string | null;
  dataSource: string | null;
  developer: string | null;
  initials: string;
  logoUrl: string | null;
  releaseYear: number | null;
  source: string | null;
  status: string | null;
  totalGames: number | null;
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

const platformAliasMap: Record<string, string> = {
  epicgames: "epicgames",
  epicgamesstore: "epicgames",
  epicgamestore: "epicgames",
  steam: "steam",
};

const normalizePlatformLookupName = (name: string) => {
  const compactName = name
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/[^a-z0-9]/g, "");

  return platformAliasMap[compactName] ?? compactName;
};

const optionalNumber = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);
  return Number.isNaN(numericValue) ? null : numericValue;
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

const toPlatformFormValue = (platform: Platform): PlatformForm => ({
  name: platform.name,
  description: platform.description ?? "",
  source: platform.source ?? "",
  status: platform.status ?? "ACTIVE",
  totalGames:
      platform.totalGames !== undefined && platform.totalGames !== null
          ? String(platform.totalGames)
          : "",
  activeUsers: platform.activeUsers ?? "",
  releaseYear:
      platform.releaseYear !== undefined && platform.releaseYear !== null
          ? String(platform.releaseYear)
          : "",
  developer: platform.developer ?? "",
  dataSource: platform.dataSource ?? "",
  logoUrl: platform.logoUrl ?? "",
});

const getInitials = (name: string) => {
  const initials = name
      .split(" ")
      .map((part) => part.trim().charAt(0))
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return initials || "PF";
};

const buildExternalPlatformMap = (platforms: ExternalGamePlatform[]) => {
  const platformMap = new Map<string, ExternalGamePlatform>();

  platforms.forEach((platform) => {
    platformMap.set(normalizePlatformLookupName(platform.name), platform);
  });

  return platformMap;
};

const toPlatformRow = (
    platform: Platform,
    externalPlatform?: ExternalGamePlatform
): PlatformRow => ({
  ...platform,
  activeUsers: externalPlatform?.activeUsers ?? "Yok",
  dataSource: externalPlatform ? "Sunucu + Harici" : "Sunucu",
  developer: externalPlatform?.developer ?? "Yok",
  initials: getInitials(platform.name),
  logoUrl: platform.logoUrl ?? null,
  releaseYear: externalPlatform?.releaseYear ?? null,
  source: platform.source ?? externalPlatform?.source ?? null,
  status: externalPlatform?.status ?? "UNKNOWN",
  totalGames: externalPlatform?.totalGames ?? 0,
});

const getFormErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 403) {
      return ADMIN_ACTION_MESSAGE;
    }

    if (status === 401) {
      return "Bu işlem için yetkiniz yok veya oturumunuz sona ermiş olabilir.";
    }

    if (status === 409) {
      return "Bu platform zaten mevcut.";
    }
  }

  return fallback;
};

const normalizeStatus = (status: string | null) => {
  return status?.trim().toUpperCase() || "UNKNOWN";
};

const getStatusLabel = (status: string | null) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "ACTIVE") {
    return "Aktif";
  }

  if (normalizedStatus === "INACTIVE") {
    return "Pasif";
  }

  if (normalizedStatus === "AVAILABLE") {
    return "Mevcut";
  }

  if (normalizedStatus === "UNAVAILABLE") {
    return "Mevcut Değil";
  }

  return "Bilinmiyor";
};

const statusBadgeClass = (status: string | null) => {
  return normalizeStatus(status) === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
      : "border-red-400/20 bg-red-500/15 text-red-200";
};

const formatActiveUsers = (activeUsers: string | null) => {
  return activeUsers?.trim() || "Yok";
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
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformRow | null>(
      null
  );
  const [formValue, setFormValue] = useState<PlatformForm>(initialForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
      useState<PlatformStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [deletingPlatformId, setDeletingPlatformId] = useState<number | null>(
      null
  );
  const [platformToDelete, setPlatformToDelete] =
      useState<PlatformRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<PlatformFormMode>("create");
  const [editingPlatformId, setEditingPlatformId] = useState<number | null>(
      null
  );
  const requestIdRef = useRef(0);

  const loadPlatforms = async (selectFirst = true) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setExternalLoading(false);
    setError(null);

    try {
      const backendPlatforms = await platformService.getPlatforms();

      if (requestIdRef.current !== requestId) {
        return;
      }

      const fallbackPlatforms = backendPlatforms.map((platform) =>
          toPlatformRow(platform)
      );

      setPlatforms(fallbackPlatforms);
      setSelectedPlatform((currentPlatform) => {
        if (!selectFirst) {
          return null;
        }

        if (!currentPlatform) {
          return fallbackPlatforms[0] ?? null;
        }

        return (
            fallbackPlatforms.find(
                (platform) => platform.id === currentPlatform.id
            ) ??
            fallbackPlatforms[0] ??
            null
        );
      });
      setLoading(false);
      setExternalLoading(true);

      const [externalPlatformsResult] = await Promise.allSettled([
        getExternalGamePlatforms(),
      ]);

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (externalPlatformsResult.status === "fulfilled") {
        const externalPlatformMap = buildExternalPlatformMap(
            externalPlatformsResult.value
        );
        const enrichedPlatforms = backendPlatforms.map((platform) =>
            toPlatformRow(
                platform,
                externalPlatformMap.get(normalizePlatformLookupName(platform.name))
            )
        );

        setPlatforms(enrichedPlatforms);
        setSelectedPlatform((currentPlatform) => {
          if (!selectFirst) {
            return null;
          }

          if (!currentPlatform) {
            return enrichedPlatforms[0] ?? null;
          }

          return (
              enrichedPlatforms.find(
                  (platform) => platform.id === currentPlatform.id
              ) ??
              enrichedPlatforms[0] ??
              null
          );
        });
      } else {
        setError(
            getErrorMessage(
                externalPlatformsResult.reason,
                "Harici platform detayları yüklenemedi; sunucu platformları fallback değerlerle gösteriliyor."
            )
        );
      }
    } catch (platformLoadError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setPlatforms([]);
      setSelectedPlatform(null);
      setError(
          getErrorMessage(
              platformLoadError,
              "Platformlar yüklenirken bir hata oluştu."
          )
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setExternalLoading(false);
      }
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadPlatforms();
    });

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const stats = useMemo(() => {
    const activePlatforms = platforms.filter(
        (platform) => normalizeStatus(platform.status) === "ACTIVE"
    ).length;
    const totalGames = platforms.reduce(
        (total, platform) => total + (platform.totalGames ?? 0),
        0
    );
    const logoCount = platforms.filter((platform) => platform.logoUrl).length;

    return {
      activePlatforms,
      logoCount,
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
      const matchesStatus =
          statusFilter === "all" ||
          normalizeStatus(platform.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [platforms, search, statusFilter]);

  const openCreateModal = () => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

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

  const openEditModal = async (platformId: number) => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setLoadingEditId(platformId);
    setFormError(null);
    setNotice(null);

    try {
      const platform = await platformService.getPlatformById(platformId);
      const platformRow = toPlatformRow(platform);

      setSelectedPlatform(platformRow);
      setFormValue(toPlatformFormValue(platform));
      setFormMode("edit");
      setEditingPlatformId(platform.id);
      setIsModalOpen(true);
    } catch (editLoadError) {
      setError(
          getErrorMessage(
              editLoadError,
              "Platform bilgileri yüklenirken bir hata oluştu."
          )
      );
    } finally {
      setLoadingEditId(null);
    }
  };

  const setField = <TKey extends keyof PlatformForm>(
      key: TKey,
      value: PlatformForm[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const handleSavePlatform = async () => {
    if (!isAdmin) {
      setFormError(ADMIN_ACTION_MESSAGE);
      return;
    }

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

  const requestDeletePlatform = (platform: PlatformRow) => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setPlatformToDelete(platform);
  };

  const closeDeleteModal = () => {
    if (deletingPlatformId !== null) {
      return;
    }

    setPlatformToDelete(null);
  };

  const confirmDeletePlatform = async () => {
    if (!platformToDelete) {
      return;
    }

    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    const wasSelectedPlatform = selectedPlatform?.id === platformToDelete.id;

    setDeletingPlatformId(platformToDelete.id);
    setError(null);
    setNotice(null);

    try {
      await platformService.deletePlatform(platformToDelete.id);

      if (wasSelectedPlatform) {
        setSelectedPlatform(null);
      }

      setPlatformToDelete(null);
      await loadPlatforms(!wasSelectedPlatform);
      setNotice("Platform başarıyla silindi.");
    } catch (deleteError) {
      setError(
          getFormErrorMessage(deleteError, "Platform silinirken bir hata oluştu.")
      );
    } finally {
      setDeletingPlatformId(null);
    }
  };

  return (
      <div className="relative bg-[#020817] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

        <div className="relative min-h-screen">
          <main className="mx-auto max-w-[1840px] px-8 py-8">
            <section className="mb-7 flex justify-end">
              {isAdmin ? (
                  <button
                      className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-xl bg-violet-600 hover:bg-violet-500 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50 transition duration-150"
                      onClick={openCreateModal}
                      type="button"
                  >
                    <span className="text-3xl font-light leading-none">+</span>
                    Platform Ekle
                  </button>
              ) : null}
            </section>

            <div className="mb-6 grid gap-4 lg:grid-cols-4">
              <StatCard
                  accent="bg-violet-500/15 text-violet-300"
                  helper="GET /games/platforms"
                  icon="P"
                  label="Toplam Platform"
                  value={String(stats.totalPlatforms)}
              />
              <StatCard
                  accent="bg-emerald-500/15 text-emerald-300"
                  helper="Durumu aktif olanlar"
                  icon="A"
                  label="Aktif Platform"
                  value={String(stats.activePlatforms)}
              />
              <StatCard
                  accent="bg-sky-500/15 text-sky-300"
                  helper="Listelenen platformlarda"
                  icon="G"
                  label="Toplam Oyun"
                  value={stats.totalGames.toLocaleString("en")}
              />
              <StatCard
                  accent="bg-violet-500/15 text-violet-300"
                  helper="logoUrl dolu kayıtlar"
                  icon="L"
                  label="Logo"
                  value={String(stats.logoCount)}
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
                      placeholder="Platform ara..."
                      type="search"
                      value={search}
                  />
                </label>

                <select
                    className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                    onChange={(event) =>
                        setStatusFilter(event.target.value as PlatformStatusFilter)
                    }
                    value={statusFilter}
                >
                  <option value="all">Duruma göre filtrele</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Pasif</option>
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

              {externalLoading && !loading ? (
                  <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100">
                    Harici veriler yükleniyor...
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
                          Sunucu kayıt döndürmedi veya filtreler eşleşmedi.
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
                          <th className="px-5 py-4">Durum</th>
                          <th className="px-5 py-4">Toplam Oyun</th>
                          <th className="px-5 py-4">Aktif Kullanıcı</th>
                          <th className="px-5 py-4">Çıkış Yılı</th>
                          <th className="px-5 py-4">Geliştirici</th>
                          <th className="px-5 py-4">Veri Kaynağı</th>
                          <th className="px-5 py-4 text-right">İşlemler</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPlatforms.map((platform) => (
                            <tr
                                className={`border-b border-white/10 hover:bg-white/[0.03] ${
                                    selectedPlatform?.id === platform.id
                                        ? "outline outline-1 outline-violet-500"
                                        : ""
                                }`}
                                key={platform.id}
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
                                      {platform.source || `ID ${platform.id}`}
                                    </p>
                                  </div>
                                </button>
                              </td>
                              <td className="px-5 py-4">
                            <span
                                className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusBadgeClass(
                                    platform.status
                                )}`}
                            >
                              {getStatusLabel(platform.status)}
                            </span>
                              </td>
                              <td className="px-5 py-4 text-slate-200">
                                {(platform.totalGames ?? 0).toLocaleString("en")}
                              </td>
                              <td className="px-5 py-4 text-slate-200">
                                {formatActiveUsers(platform.activeUsers)}
                              </td>
                              <td className="px-5 py-4 text-slate-200">
                                {platform.releaseYear ?? "Yok"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {platform.developer || "Yok"}
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {platform.dataSource || "Sunucu"}
                              </td>
                              <td className="px-5 py-4">
                                {isAdmin ? (
                                    <div className="flex justify-end gap-2">
                                      <button
                                          className="cursor-pointer rounded-lg border border-violet-400/30 px-3 py-2 text-xs font-bold text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                                          disabled={
                                              loadingEditId === platform.id ||
                                              deletingPlatformId === platform.id
                                          }
                                          onClick={() => {
                                            void openEditModal(platform.id);
                                          }}
                                          type="button"
                                      >
                                        {loadingEditId === platform.id
                                            ? "Yükleniyor..."
                                            : "Seç"}
                                      </button>
                                      <button
                                          className="cursor-pointer rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                                          disabled={
                                              deletingPlatformId === platform.id ||
                                              loadingEditId === platform.id
                                          }
                                          onClick={() => {
                                            requestDeletePlatform(platform);
                                          }}
                                          type="button"
                                      >
                                        {deletingPlatformId === platform.id
                                            ? "Siliniyor..."
                                            : "Sil"}
                                      </button>
                                    </div>
                                ) : null}
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
                          {selectedPlatform.source || `Platform ID: ${selectedPlatform.id}`}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {selectedPlatform.description || "Açıklama yok."}
                    </p>
                    <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-slate-400">Toplam Oyun</dt>
                        <dd>{selectedPlatform.totalGames ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Geliştirici</dt>
                        <dd>{selectedPlatform.developer || "Yok"}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Veri Kaynağı</dt>
                        <dd>{selectedPlatform.dataSource || "Sunucu"}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Logo URL</dt>
                        <dd className="break-all">
                          {selectedPlatform.logoUrl || "Yok"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Oluşturulma</dt>
                        <dd>{formatDate(selectedPlatform.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Güncellenme</dt>
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
                      {formMode === "edit" ? "Platformu Düzenle" : "Platform Ekle"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {formMode === "edit"
                          ? "Sunucu API ile platform kaydını güncelle."
                          : "Sunucu API ile yeni platform kaydı oluştur."}
                    </p>
                  </div>
                  <button
                      aria-label="Modalı kapat"
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
                  Platform Adı
                </span>
                    <input
                        className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                        maxLength={100}
                        onChange={(event) => setField("name", event.target.value)}
                        placeholder="Platform adını girin..."
                        required
                        value={formValue.name}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white">Açıklama</span>
                    <textarea
                        className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                        maxLength={500}
                        onChange={(event) =>
                            setField("description", event.target.value)
                        }
                        placeholder="Platform açıklamasını girin..."
                        value={formValue.description}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Kaynak</span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={100}
                          onChange={(event) => setField("source", event.target.value)}
                          placeholder="STEAM, EPIC..."
                          value={formValue.source}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-white">Durum</span>
                      <select
                          className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                          onChange={(event) => setField("status", event.target.value)}
                          value={formValue.status}
                      >
                        <option value="ACTIVE">Aktif</option>
                        <option value="INACTIVE">Pasif</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Toplam Oyun
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
                    Aktif Kullanıcı
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={100}
                          onChange={(event) =>
                              setField("activeUsers", event.target.value)
                          }
                          placeholder="Yok, 10M+..."
                          value={formValue.activeUsers}
                      />
                    </label>

                    <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Çıkış Yılı
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
                      <span className="text-sm font-bold text-white">Geliştirici</span>
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
                    Veri Kaynağı
                  </span>
                      <input
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                          maxLength={150}
                          onChange={(event) =>
                              setField("dataSource", event.target.value)
                          }
                          placeholder="Sunucu, Steam API..."
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
                        className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 transition duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving || !formValue.name.trim()}
                        type="submit"
                    >
                      {saving
                          ? "Kaydediliyor..."
                          : formMode === "edit"
                              ? "Platformu Güncelle"
                              : "Platform Oluştur"}
                    </button>
                    <button
                        className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white"
                        onClick={closeModal}
                        type="button"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </section>
            </div>
        ) : null}
        <DeleteConfirmModal
            description="Bu platform kaydı kalıcı olarak silinecek. Devam etmek istiyor musunuz?"
            isDeleting={deletingPlatformId !== null}
            isOpen={platformToDelete !== null}
            itemName={platformToDelete?.name}
            onCancel={closeDeleteModal}
            onConfirm={() => {
              void confirmDeletePlatform();
            }}
            title="Platformu Sil"
        />
      </div>
  );
};

export default GamePlatformsPage;