import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import GameNavbar from "../components/GameNavbar";
import { gameService } from "../services/gameService";
import { systemRequirementService } from "../services/systemRequirementService";
import type { Game } from "../types/gameTypes";
import type {
  SystemRequirement,
  SystemRequirementRequest,
} from "../types/systemRequirementTypes";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

type RequirementFormMode = "create" | "edit";

const initialForm: SystemRequirementRequest = {
  minimumOs: "",
  minimumCpu: "",
  minimumGpu: "",
  minimumRam: "",
  minimumStorage: "",
  recommendedOs: "",
  recommendedCpu: "",
  recommendedGpu: "",
  recommendedRam: "",
  recommendedStorage: "",
  notes: "",
};

const minimumFields = [
  "minimumOs",
  "minimumCpu",
  "minimumGpu",
  "minimumRam",
  "minimumStorage",
] as const;

const recommendedFields = [
  "recommendedOs",
  "recommendedCpu",
  "recommendedGpu",
  "recommendedRam",
  "recommendedStorage",
] as const;

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizeRequirementRequest = (
  value: SystemRequirementRequest
): SystemRequirementRequest => ({
  minimumOs: emptyToNull(value.minimumOs),
  minimumCpu: emptyToNull(value.minimumCpu),
  minimumGpu: emptyToNull(value.minimumGpu),
  minimumRam: emptyToNull(value.minimumRam),
  minimumStorage: emptyToNull(value.minimumStorage),
  recommendedOs: emptyToNull(value.recommendedOs),
  recommendedCpu: emptyToNull(value.recommendedCpu),
  recommendedGpu: emptyToNull(value.recommendedGpu),
  recommendedRam: emptyToNull(value.recommendedRam),
  recommendedStorage: emptyToNull(value.recommendedStorage),
  notes: emptyToNull(value.notes),
});

const toRequirementFormValue = (
  requirement: SystemRequirement
): SystemRequirementRequest => ({
  minimumOs: requirement.minimumOs ?? "",
  minimumCpu: requirement.minimumCpu ?? "",
  minimumGpu: requirement.minimumGpu ?? "",
  minimumRam: requirement.minimumRam ?? "",
  minimumStorage: requirement.minimumStorage ?? "",
  recommendedOs: requirement.recommendedOs ?? "",
  recommendedCpu: requirement.recommendedCpu ?? "",
  recommendedGpu: requirement.recommendedGpu ?? "",
  recommendedRam: requirement.recommendedRam ?? "",
  recommendedStorage: requirement.recommendedStorage ?? "",
  notes: requirement.notes ?? "",
});

const getFilledCount = (
  requirement: SystemRequirement | null,
  fields: readonly (keyof SystemRequirement)[]
) => {
  if (!requirement) {
    return 0;
  }

  return fields.filter((field) => Boolean(requirement[field])).length;
};

const getCoverage = (
  requirement: SystemRequirement | null,
  fields: readonly (keyof SystemRequirement)[]
) => {
  return Math.round((getFilledCount(requirement, fields) / fields.length) * 100);
};

const getInitials = (title: string) => {
  const initials = title
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "SR";
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

const getRequirementErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 403) {
      return ADMIN_ACTION_MESSAGE;
    }

    if (status === 401) {
      return "Bu işlem için yetkiniz yok veya oturumunuz sona ermiş olabilir.";
    }

    if (status === 409) {
      return "Bu oyun için sistem gereksinimi zaten mevcut.";
    }
  }

  return fallback;
};

const isNotFoundError = (error: unknown) => {
  return isAxiosError(error) && error.response?.status === 404;
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

const RequirementValue = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <div className="grid grid-cols-[150px_1fr] gap-4">
    <dt className="text-slate-400">{label}</dt>
    <dd className="text-slate-100">{value || "Yok"}</dd>
  </div>
);

const GameSystemRequirementsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [requirement, setRequirement] = useState<SystemRequirement | null>(null);
  const [search, setSearch] = useState("");
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingRequirement, setLoadingRequirement] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<RequirementFormMode>("create");
  const [formGameId, setFormGameId] = useState<number | null>(null);
  const [formValue, setFormValue] =
    useState<SystemRequirementRequest>(initialForm);

  const selectedGame = useMemo(() => {
    return games.find((game) => game.id === selectedGameId) ?? null;
  }, [games, selectedGameId]);

  const formGame = useMemo(() => {
    return games.find((game) => game.id === formGameId) ?? null;
  }, [formGameId, games]);

  const minimumCoverage = useMemo(() => {
    return getCoverage(requirement, minimumFields);
  }, [requirement]);

  const recommendedCoverage = useMemo(() => {
    return getCoverage(requirement, recommendedFields);
  }, [requirement]);

  const filteredRequirements = useMemo(() => {
    if (!requirement || !selectedGame) {
      return [];
    }

    const normalizedSearch = search.trim().toLocaleLowerCase("tr");

    if (!normalizedSearch) {
      return [requirement];
    }

    const searchableText = [
      selectedGame.title,
      selectedGame.platform,
      selectedGame.source,
      requirement.minimumOs,
      requirement.minimumCpu,
      requirement.minimumGpu,
      requirement.recommendedOs,
      requirement.recommendedCpu,
      requirement.recommendedGpu,
      requirement.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr");

    return searchableText.includes(normalizedSearch) ? [requirement] : [];
  }, [requirement, search, selectedGame]);

  const stats = useMemo(() => {
    return {
      minimumFields: `${getFilledCount(requirement, minimumFields)}/5`,
      recommendedFields: `${getFilledCount(requirement, recommendedFields)}/5`,
      selectedGames: selectedGame ? "1" : "0",
      totalSets: requirement ? "1" : "0",
    };
  }, [requirement, selectedGame]);

  const loadSystemRequirements = async (gameId: number) => {
    setLoadingRequirement(true);
    setError(null);

    try {
      const nextRequirement =
        await systemRequirementService.getSystemRequirements(gameId);
      setRequirement(nextRequirement);
    } catch (requirementError) {
      setRequirement(null);

      if (!isNotFoundError(requirementError)) {
        setError(
          getErrorMessage(
            requirementError,
            "Sistem gereksinimleri yüklenirken bir hata oluştu."
          )
        );
      }
    } finally {
      setLoadingRequirement(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      setLoadingGames(true);
      setError(null);

      try {
        const results = await gameService.getGames();

        if (!active) {
          return;
        }

        setGames(results);
      } catch (gamesError) {
        if (!active) {
          return;
        }

        setGames([]);
        setError(
          getErrorMessage(gamesError, "Oyunlar yüklenirken bir hata oluştu.")
        );
      } finally {
        if (active) {
          setLoadingGames(false);
        }
      }
    };

    void loadGames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setRequirement(null);
    setFormError(null);

    if (selectedGameId === null) {
      setLoadingRequirement(false);
      return;
    }

    void loadSystemRequirements(selectedGameId);
  }, [selectedGameId]);

  const setField = <TKey extends keyof SystemRequirementRequest>(
    key: TKey,
    value: SystemRequirementRequest[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const openCreateModal = () => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setFormValue(initialForm);
    setFormGameId(selectedGameId);
    setFormError(null);
    setFormMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = async () => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (selectedGameId === null) {
      setNotice("Sistem gereksinimini düzenlemek için önce bir oyun seçin.");
      return;
    }

    setLoadingEdit(true);
    setFormError(null);
    setNotice(null);

    try {
      const nextRequirement =
        await systemRequirementService.getSystemRequirements(selectedGameId);
      setRequirement(nextRequirement);
      setFormValue(toRequirementFormValue(nextRequirement));
      setFormGameId(selectedGameId);
      setFormMode("edit");
      setIsModalOpen(true);
    } catch (editLoadError) {
      setError(
        getRequirementErrorMessage(
          editLoadError,
          "Sistem gereksinimi bilgileri yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoadingEdit(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormValue(initialForm);
    setFormGameId(null);
    setFormError(null);
    setFormMode("create");
    setSaving(false);
  };

  const handleSaveRequirement = async () => {
    if (!isAdmin) {
      setFormError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const targetGameId = formMode === "edit" ? selectedGameId : formGameId;

    if (targetGameId === null) {
      setFormError("Lütfen bir oyun seçin.");
      return;
    }

    const request = normalizeRequirementRequest(formValue);

    setSaving(true);
    setFormError(null);

    try {
      if (formMode === "edit") {
        await systemRequirementService.updateSystemRequirements(
          targetGameId,
          request
        );
      } else {
        await systemRequirementService.createSystemRequirements(
          targetGameId,
          request
        );
      }

      closeModal();
      setSelectedGameId(targetGameId);
      setNotice(
        formMode === "edit"
          ? "Sistem gereksinimi başarıyla güncellendi."
          : "Sistem gereksinimi başarıyla eklendi."
      );
      await loadSystemRequirements(targetGameId);
    } catch (saveError) {
      setFormError(
        getRequirementErrorMessage(
          saveError,
          formMode === "edit"
            ? "Sistem gereksinimi güncellenirken bir hata oluştu."
            : "Sistem gereksinimi eklenirken bir hata oluştu."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteRequirement = () => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (selectedGameId === null || !selectedGame) {
      setError("Sistem gereksinimini silmek için önce bir oyun seçin.");
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

  const confirmDeleteRequirement = async () => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    if (selectedGameId === null || !selectedGame) {
      setError("Sistem gereksinimini silmek için önce bir oyun seçin.");
      setIsDeleteModalOpen(false);
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      await systemRequirementService.deleteSystemRequirements(selectedGameId);
      setRequirement(null);
      await loadSystemRequirements(selectedGameId);
      setIsDeleteModalOpen(false);
      setNotice("Sistem gereksinimi başarıyla silindi.");
    } catch (deleteError) {
      setError(
        getRequirementErrorMessage(
          deleteError,
          "Sistem gereksinimi silinirken bir hata oluştu."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="SystemRequirements" />

        <main className="mx-auto max-w-[1840px] px-8 py-8">
          <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                SR
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Sistem Gereksinimleri
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Seçili oyunun sistem gereksinimlerini backend API üzerinden
                  yönet.
                </p>
              </div>
            </div>

            {isAdmin ? (
              <button
                className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                onClick={openCreateModal}
                type="button"
              >
                <span className="text-3xl font-light leading-none">+</span>
                Sistem Gereksinimi Ekle
              </button>
            ) : null}
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Seçili oyun için backend kaydı"
              icon="S"
              label="Toplam Gereksinim Kaydı"
              value={stats.totalSets}
            />
            <StatCard
              accent="bg-indigo-500/15 text-indigo-300"
              helper="Dropdown seçimine göre"
              icon="G"
              label="Seçili Oyun"
              value={stats.selectedGames}
            />
            <StatCard
              accent="bg-emerald-500/15 text-emerald-300"
              helper="Minimum alan doluluğu"
              icon="M"
              label="Minimum Alanlar"
              value={stats.minimumFields}
            />
            <StatCard
              accent="bg-pink-500/15 text-pink-300"
              helper="Önerilen alan doluluğu"
              icon="R"
              label="Önerilen Alanlar"
              value={stats.recommendedFields}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_520px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[1.2fr_1fr_0.9fr_0.8fr]">
                <label className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ?
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Sistem gereksinimlerinde ara..."
                    value={search}
                  />
                </label>

                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loadingGames}
                  onChange={(event) => {
                    const nextGameId = event.target.value
                      ? Number(event.target.value)
                      : null;
                    setNotice(null);
                    setSelectedGameId(nextGameId);
                  }}
                  value={selectedGameId ?? ""}
                >
                  <option value="">
                    {loadingGames ? "Oyunlar yükleniyor..." : "Oyun seçin"}
                  </option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>

                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  value={selectedGame?.source ?? ""}
                  disabled
                >
                  <option value="">
                    {selectedGame ? selectedGame.source : "Kaynak yok"}
                  </option>
                </select>

                <label className="grid h-12 grid-cols-[0.8fr_1.2fr] items-center gap-3 text-sm text-slate-400">
                  <span className="text-right">Sırala:</span>
                  <select
                    className="h-12 cursor-not-allowed rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none opacity-70"
                    disabled
                  >
                    <option>En Yeni Önce</option>
                  </select>
                </label>
              </div>

              {notice ? (
                <div className="m-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div className="m-4 rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {loadingGames || loadingRequirement ? (
                <div className="h-96 animate-pulse bg-slate-900/70" />
              ) : null}

              {!loadingGames && !loadingRequirement && selectedGameId === null ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Oyun seçilmedi
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Sistem gereksinimlerini görüntülemek için bir oyun seçin.
                    </p>
                  </div>
                </div>
              ) : null}

              {!loadingGames &&
              !loadingRequirement &&
              selectedGameId !== null &&
              !requirement ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Sistem gereksinimi bulunamadı
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Bu oyun için sunucu kaydı yok. Sistem Gereksinimi Ekle ile
                      yeni kayıt oluşturabilirsiniz.
                    </p>
                  </div>
                </div>
              ) : null}

              {!loadingGames &&
              !loadingRequirement &&
              selectedGameId !== null &&
              requirement &&
              filteredRequirements.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Arama sonucu bulunamadı
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Seçili oyun için sistem gereksinimi var, ancak arama
                      kriteri eşleşmedi.
                    </p>
                  </div>
                </div>
              ) : null}

              {!loadingGames &&
              !loadingRequirement &&
              filteredRequirements.length > 0 &&
              selectedGame ? (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Oyun / Gereksinim Kaydı</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Gereksinim Türü</th>
                      <th className="px-6 py-4">Son Güncelleme</th>
                      <th className="px-6 py-4">Min. / Önerilen Doluluk</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequirements.map((nextRequirement) => (
                      <tr
                        className="border-b border-white/10 outline outline-1 outline-violet-500"
                        key={nextRequirement.id}
                      >
                        <td className="px-6 py-5">
                          <button
                            className="flex cursor-pointer items-center gap-4 text-left"
                            onClick={() => setRequirement(nextRequirement)}
                            type="button"
                          >
                            <span className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                              {getInitials(selectedGame.title)}
                            </span>
                            <span>
                              <span className="font-bold text-white">
                                {selectedGame.title}
                              </span>
                              <span className="mt-1 block text-sm text-slate-400">
                                Oyun ID: {selectedGame.id}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {selectedGame.platform || "Bilinmiyor"}
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm text-violet-100">
                            Sistem Gereksinimi
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {formatDate(
                            nextRequirement.updatedAt ??
                              nextRequirement.createdAt
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="mb-2 font-bold text-white">
                            {minimumCoverage}% / {recommendedCoverage}%
                          </div>
                          <div className="grid gap-1">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-emerald-400"
                                style={{ width: `${minimumCoverage}%` }}
                              />
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-violet-500"
                                style={{ width: `${recommendedCoverage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-3">
                            <button
                              className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-white/10 text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => setRequirement(nextRequirement)}
                              title="Detay"
                              type="button"
                            >
                              Detay
                            </button>
                            {isAdmin ? (
                              <>
                                <button
                              className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-violet-400/30 text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={loadingEdit || deleting}
                              onClick={() => {
                                void openEditModal();
                              }}
                              title="Düzenle"
                              type="button"
                            >
                              {loadingEdit ? "..." : "Düzenle"}
                            </button>
                            <button
                              className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-red-400/30 text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={deleting || loadingEdit}
                              onClick={() => {
                                requestDeleteRequirement();
                              }}
                              title="Sil"
                              type="button"
                            >
                              {deleting ? "..." : "Sil"}
                            </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </section>

            <aside className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {selectedGame ? (
                <>
                  <div className="flex items-center gap-5">
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-2xl font-black text-white">
                      {getInitials(selectedGame.title)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white">
                          {selectedGame.title}
                        </h2>
                        <span className="rounded-lg border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">
                          {selectedGame.source}
                        </span>
                      </div>
                      <p className="mt-1 text-violet-300">
                        Oyun ID: {selectedGame.id}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {selectedGame.platform || "Platform bilgisi yok"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-8 border-b border-white/10">
                    {["Özet", "Minimum", "Önerilen", "Notlar"].map(
                      (tab, index) => (
                        <button
                          className={`cursor-pointer pb-3 text-sm font-bold ${
                            index === 0
                              ? "border-b-2 border-violet-500 text-white"
                              : "text-slate-400"
                          }`}
                          key={tab}
                          type="button"
                        >
                          {tab}
                        </button>
                      )
                    )}
                  </div>

                  {requirement ? (
                    <>
                      <p className="mt-5 text-sm leading-6 text-slate-300">
                        {requirement.notes ||
                          "Bu sistem gereksinimi için not girilmemiş."}
                      </p>

                      <dl className="mt-6 grid gap-3 text-sm">
                        <RequirementValue
                          label="Minimum İşletim Sistemi"
                          value={requirement.minimumOs}
                        />
                        <RequirementValue
                          label="Minimum İşlemci"
                          value={requirement.minimumCpu}
                        />
                        <RequirementValue
                          label="Minimum Ekran Kartı"
                          value={requirement.minimumGpu}
                        />
                        <RequirementValue
                          label="Minimum RAM"
                          value={requirement.minimumRam}
                        />
                        <RequirementValue
                          label="Minimum Depolama"
                          value={requirement.minimumStorage}
                        />
                        <RequirementValue
                          label="Önerilen İşletim Sistemi"
                          value={requirement.recommendedOs}
                        />
                        <RequirementValue
                          label="Önerilen İşlemci"
                          value={requirement.recommendedCpu}
                        />
                        <RequirementValue
                          label="Önerilen Ekran Kartı"
                          value={requirement.recommendedGpu}
                        />
                        <RequirementValue
                          label="Önerilen RAM"
                          value={requirement.recommendedRam}
                        />
                        <RequirementValue
                          label="Önerilen Depolama"
                          value={requirement.recommendedStorage}
                        />
                        <RequirementValue
                          label="Güncellenme"
                          value={formatDate(
                            requirement.updatedAt ?? requirement.createdAt
                          )}
                        />
                      </dl>
                    </>
                  ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">
                      Bu oyun için sistem gereksinimi kaydı bulunamadı.
                    </div>
                  )}
                </>
              ) : (
                <div className="grid min-h-[520px] place-items-center p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Oyun seçilmedi
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Detayları görmek için listeden bir oyun seçin.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {formMode === "edit"
                    ? "Sistem Gereksinimini Düzenle"
                    : "Sistem Gereksinimi Ekle"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {formGame
                    ? `${formGame.title} için sistem gereksinimi kaydı.`
                    : "Sistem gereksinimi için bir oyun seçin."}
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
                void handleSaveRequirement();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Oyun</span>
                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loadingGames || formMode === "edit"}
                  onChange={(event) => {
                    const nextGameId = event.target.value
                      ? Number(event.target.value)
                      : null;
                    setFormGameId(nextGameId);
                  }}
                  value={formGameId ?? ""}
                >
                  <option value="">
                    {loadingGames ? "Oyunlar yükleniyor..." : "Oyun seçin"}
                  </option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum İşletim Sistemi
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("minimumOs", event.target.value)
                    }
                    placeholder="Windows 10 64-bit"
                    value={formValue.minimumOs ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen İşletim Sistemi
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("recommendedOs", event.target.value)
                    }
                    placeholder="Windows 11 64-bit"
                    value={formValue.recommendedOs ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum İşlemci
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("minimumCpu", event.target.value)
                    }
                    placeholder="Intel i5"
                    value={formValue.minimumCpu ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen İşlemci
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("recommendedCpu", event.target.value)
                    }
                    placeholder="Intel i7"
                    value={formValue.recommendedCpu ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum Ekran Kartı
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("minimumGpu", event.target.value)
                    }
                    placeholder="GTX 1050"
                    value={formValue.minimumGpu ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen Ekran Kartı
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("recommendedGpu", event.target.value)
                    }
                    placeholder="RTX 2060"
                    value={formValue.recommendedGpu ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum RAM
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("minimumRam", event.target.value)
                    }
                    placeholder="8 GB"
                    value={formValue.minimumRam ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen RAM
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("recommendedRam", event.target.value)
                    }
                    placeholder="16 GB"
                    value={formValue.recommendedRam ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Minimum Depolama
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("minimumStorage", event.target.value)
                    }
                    placeholder="50 GB"
                    value={formValue.minimumStorage ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Önerilen Depolama
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("recommendedStorage", event.target.value)
                    }
                    placeholder="100 GB SSD"
                    value={formValue.recommendedStorage ?? ""}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Notlar</span>
                <textarea
                  className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  onChange={(event) => setField("notes", event.target.value)}
                  placeholder="Ek sistem gereksinimi notları"
                  value={formValue.notes ?? ""}
                />
              </label>

              {formError ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-3 text-sm text-red-100">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-violet-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving}
                  type="submit"
                >
                  {saving
                    ? "Kaydediliyor..."
                    : formMode === "edit"
                      ? "Sistem Gereksinimini Güncelle"
                      : "Sistem Gereksinimi Ekle"}
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
        description="Seçili oyun için sistem gereksinimi kaydı silinecek. Devam etmek istiyor musunuz?"
        isDeleting={deleting}
        isOpen={isDeleteModalOpen}
        itemName={selectedGame?.title}
        onCancel={closeDeleteModal}
        onConfirm={() => {
          void confirmDeleteRequirement();
        }}
        title="Sistem Gereksinimini Sil"
      />
    </div>
  );
};

export default GameSystemRequirementsPage;
