import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { developerService } from "../services/developerService";
import type { Developer, DeveloperRequest } from "../types/developerTypes";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

type DeveloperViewMode = "grid" | "list";
type DeveloperProfileStatus = "complete" | "missing";
type DeveloperStatusFilter = "all" | DeveloperProfileStatus;
type DeveloperFormMode = "create" | "edit";
type SortOption = "newest" | "name-asc" | "name-desc";

type DeveloperRow = Developer & {
  initials: string;
  profileStatus: DeveloperProfileStatus;
  websiteHost: string | null;
};

const initialForm: DeveloperRequest = {
  name: "",
  description: "",
  websiteUrl: "",
  logoUrl: "",
  country: "",
  foundedDate: "",
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizeDeveloperRequest = (
  value: DeveloperRequest
): DeveloperRequest => ({
  name: value.name.trim(),
  description: emptyToNull(value.description),
  websiteUrl: emptyToNull(value.websiteUrl),
  logoUrl: emptyToNull(value.logoUrl),
  country: emptyToNull(value.country),
  foundedDate: emptyToNull(value.foundedDate),
});

const toDeveloperFormValue = (developer: Developer): DeveloperRequest => ({
  name: developer.name,
  description: developer.description ?? "",
  websiteUrl: developer.websiteUrl ?? "",
  logoUrl: developer.logoUrl ?? "",
  country: developer.country ?? "",
  foundedDate: developer.foundedDate ?? "",
});

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "GD";
};

const getWebsiteHost = (websiteUrl: string | null) => {
  if (!websiteUrl) {
    return null;
  }

  try {
    return new URL(websiteUrl).host;
  } catch {
    return websiteUrl;
  }
};

const toDeveloperRow = (developer: Developer): DeveloperRow => {
  const profileStatus =
    developer.description && developer.websiteUrl && developer.country
      ? "complete"
      : "missing";

  return {
    ...developer,
    initials: getInitials(developer.name),
    profileStatus,
    websiteHost: getWebsiteHost(developer.websiteUrl),
  };
};

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
      return "Bu geliştirici zaten mevcut.";
    }
  }

  return fallback;
};

const profileBadgeClass = (status: DeveloperProfileStatus) => {
  return status === "complete"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-amber-400/20 bg-amber-500/15 text-amber-200";
};

const profileStatusLabel = (status: DeveloperProfileStatus) => {
  return status === "complete" ? "Tam profil" : "Eksik bilgi";
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

const GameDevelopersPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [developers, setDevelopers] = useState<DeveloperRow[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] =
    useState<DeveloperRow | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState<DeveloperStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<DeveloperViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [deletingDeveloperId, setDeletingDeveloperId] = useState<number | null>(
    null
  );
  const [developerToDelete, setDeveloperToDelete] =
    useState<DeveloperRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<DeveloperFormMode>("create");
  const [editingDeveloperId, setEditingDeveloperId] = useState<number | null>(
    null
  );
  const [formValue, setFormValue] = useState<DeveloperRequest>(initialForm);

  const loadDevelopers = async (selectFirst = true) => {
    setLoading(true);
    setError(null);

    try {
      const results = await developerService.getDevelopers();
      const nextDevelopers = results.map(toDeveloperRow);

      setDevelopers(nextDevelopers);
      setSelectedDeveloper((currentDeveloper) => {
        if (!selectFirst) {
          return null;
        }

        if (!currentDeveloper) {
          return nextDevelopers[0] ?? null;
        }

        return (
          nextDevelopers.find(
            (developer) => developer.id === currentDeveloper.id
          ) ??
          nextDevelopers[0] ??
          null
        );
      });
    } catch (developerError) {
      setDevelopers([]);
      setSelectedDeveloper(null);
      setError(
        getErrorMessage(
          developerError,
          "Geliştiriciler yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialDevelopers = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await developerService.getDevelopers();

        if (!active) {
          return;
        }

        const nextDevelopers = results.map(toDeveloperRow);
        setDevelopers(nextDevelopers);
        setSelectedDeveloper(nextDevelopers[0] ?? null);
      } catch (developerError) {
        if (!active) {
          return;
        }

        setDevelopers([]);
        setSelectedDeveloper(null);
        setError(
          getErrorMessage(
            developerError,
            "Geliştiriciler yüklenirken bir hata oluştu."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInitialDevelopers();

    return () => {
      active = false;
    };
  }, []);

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        developers
          .map((developer) => developer.country)
          .filter((nextCountry): nextCountry is string => Boolean(nextCountry))
      )
    ).sort((leftCountry, rightCountry) =>
      leftCountry.localeCompare(rightCountry, "tr")
    );
  }, [developers]);

  const stats = useMemo(() => {
    const countriesRepresented = new Set(
      developers
        .map((developer) => developer.country)
        .filter((nextCountry): nextCountry is string => Boolean(nextCountry))
    ).size;
    const websiteCount = developers.filter(
      (developer) => developer.websiteUrl
    ).length;
    const completeProfiles = developers.filter(
      (developer) => developer.profileStatus === "complete"
    ).length;

    return {
      completeProfiles,
      countriesRepresented,
      totalDevelopers: developers.length,
      websiteCount,
    };
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr");

    const filtered = developers.filter((developer) => {
      const searchableText = [
        developer.name,
        developer.description,
        developer.country,
        developer.websiteUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCountry = country === "all" || developer.country === country;
      const matchesStatus =
        status === "all" || developer.profileStatus === status;

      return matchesSearch && matchesCountry && matchesStatus;
    });

    return [...filtered].sort((leftDeveloper, rightDeveloper) => {
      if (sortBy === "name-asc") {
        return leftDeveloper.name.localeCompare(rightDeveloper.name, "tr");
      }

      if (sortBy === "name-desc") {
        return rightDeveloper.name.localeCompare(leftDeveloper.name, "tr");
      }

      return rightDeveloper.createdAt.localeCompare(leftDeveloper.createdAt);
    });
  }, [country, developers, search, sortBy, status]);

  const openCreateModal = () => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setFormValue(initialForm);
    setFormError(null);
    setFormMode("create");
    setEditingDeveloperId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormValue(initialForm);
    setFormError(null);
    setFormMode("create");
    setEditingDeveloperId(null);
    setSelectedDeveloper(null);
    setSaving(false);
  };

  const openEditModal = async (developerId: number) => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setLoadingEditId(developerId);
    setFormError(null);
    setNotice(null);

    try {
      const developer = await developerService.getDeveloperById(developerId);
      const developerRow = toDeveloperRow(developer);

      setSelectedDeveloper(developerRow);
      setFormValue(toDeveloperFormValue(developer));
      setFormMode("edit");
      setEditingDeveloperId(developer.id);
      setIsModalOpen(true);
    } catch (editLoadError) {
      setError(
        getErrorMessage(
          editLoadError,
          "Geliştirici bilgileri yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoadingEditId(null);
    }
  };

  const setField = <TKey extends keyof DeveloperRequest>(
    key: TKey,
    value: DeveloperRequest[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const handleSaveDeveloper = async () => {
    if (!isAdmin) {
      setFormError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const request = normalizeDeveloperRequest(formValue);

    if (!request.name) {
      setFormError("Geliştirici adı zorunludur.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (formMode === "edit") {
        if (editingDeveloperId === null) {
          setFormError("Düzenlenecek geliştirici bulunamadı.");
          return;
        }

        await developerService.updateDeveloper(editingDeveloperId, request);
      } else {
        await developerService.createDeveloper(request);
      }

      closeModal();
      setNotice(
        formMode === "edit"
          ? "Geliştirici başarıyla güncellendi."
          : "Geliştirici başarıyla eklendi."
      );
      await loadDevelopers(false);
    } catch (saveError) {
      setFormError(
        getFormErrorMessage(
          saveError,
          formMode === "edit"
            ? "Geliştirici güncellenirken bir hata oluştu."
            : "Geliştirici eklenirken bir hata oluştu."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteDeveloper = (developer: DeveloperRow) => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    setDeveloperToDelete(developer);
  };

  const closeDeleteModal = () => {
    if (deletingDeveloperId !== null) {
      return;
    }

    setDeveloperToDelete(null);
  };

  const confirmDeleteDeveloper = async () => {
    if (!developerToDelete) {
      return;
    }

    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const wasSelectedDeveloper = selectedDeveloper?.id === developerToDelete.id;

    setDeletingDeveloperId(developerToDelete.id);
    setError(null);
    setNotice(null);

    try {
      await developerService.deleteDeveloper(developerToDelete.id);

      if (wasSelectedDeveloper) {
        setSelectedDeveloper(null);
      }

      setDeveloperToDelete(null);
      await loadDevelopers(!wasSelectedDeveloper);
      setNotice("Geliştirici başarıyla silindi.");
    } catch (deleteError) {
      setError(
        getFormErrorMessage(
          deleteError,
          "Geliştirici silinirken bir hata oluştu."
        )
      );
    } finally {
      setDeletingDeveloperId(null);
    }
  };

  return (
    <div className="relative bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                D
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Oyun Geliştiricileri
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Sunucu API üzerinden geliştirici stüdyolarını yönet.
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
                Geliştirici Ekle
              </button>
            ) : null}
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-sky-500/15 text-sky-300"
              helper="Sunucu kayıtları"
              icon="D"
              label="Toplam Geliştirici"
              value={String(stats.totalDevelopers)}
            />
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Web sitesi URL dolu"
              icon="W"
              label="Web Sitesi"
              value={String(stats.websiteCount)}
            />
            <StatCard
              accent="bg-amber-500/15 text-amber-300"
              helper="Açıklama, ülke ve web sitesi var"
              icon="P"
              label="Tam Profil"
              value={String(stats.completeProfiles)}
            />
            <StatCard
              accent="bg-cyan-500/15 text-cyan-300"
              helper="Sunucu ülke alanı"
              icon="C"
              label="Temsil Edilen Ülke"
              value={String(stats.countriesRepresented)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_470px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_auto]">
                <label className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                    ?
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Geliştirici ara..."
                    value={search}
                  />
                </label>

                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setCountry(event.target.value)}
                  value={country}
                >
                  <option value="all">Tüm Ülkeler</option>
                  {countries.map((nextCountry) => (
                    <option key={nextCountry} value={nextCountry}>
                      {nextCountry}
                    </option>
                  ))}
                </select>

                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) =>
                    setStatus(event.target.value as DeveloperStatusFilter)
                  }
                  value={status}
                >
                  <option value="all">Tüm Profiller</option>
                  <option value="complete">Tam</option>
                  <option value="missing">Eksik Bilgi</option>
                </select>

                <select
                  className="h-12 cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none"
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  value={sortBy}
                >
                  <option value="newest">Sırala: En Yeni Önce</option>
                  <option value="name-asc">Ad: A-Z</option>
                  <option value="name-desc">Ad: Z-A</option>
                </select>

                <div className="flex h-12 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-1">
                  <button
                    className={`grid w-12 cursor-pointer place-items-center rounded-lg ${
                      viewMode === "grid" ? "bg-violet-600" : "text-slate-400"
                    }`}
                    onClick={() => setViewMode("grid")}
                    type="button"
                  >
                    Izgara
                  </button>
                  <button
                    className={`grid w-12 cursor-pointer place-items-center rounded-lg ${
                      viewMode === "list" ? "bg-violet-600" : "text-slate-400"
                    }`}
                    onClick={() => setViewMode("list")}
                    type="button"
                  >
                    Liste
                  </button>
                </div>
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

              {loading ? (
                <div className="h-96 animate-pulse bg-slate-900/70" />
              ) : null}

              {!loading && !error && filteredDevelopers.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Geliştirici bulunamadı
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Sunucu henüz kayıt döndürmedi veya filtreler eşleşmedi.
                    </p>
                  </div>
                </div>
              ) : null}

              {!loading && !error && filteredDevelopers.length > 0 && viewMode === "list" ? (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Geliştirici</th>
                      <th className="px-6 py-4">Ülke</th>
                      <th className="px-6 py-4">Web Sitesi</th>
                      <th className="px-6 py-4">Profil</th>
                      <th className="px-6 py-4">Güncellenme</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevelopers.map((developer) => (
                      <tr
                        className={`border-b border-white/10 ${
                          selectedDeveloper?.id === developer.id
                            ? "outline outline-1 outline-violet-500"
                            : ""
                        }`}
                        key={developer.id}
                      >
                        <td className="px-6 py-5">
                          <button
                            className="flex cursor-pointer items-center gap-4 text-left"
                            onClick={() => setSelectedDeveloper(developer)}
                            type="button"
                          >
                            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                              {developer.initials}
                            </span>
                            <span>
                              <span className="font-bold text-white">
                                {developer.name}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-sm text-slate-400">
                                {developer.description || "Açıklama yok."}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {developer.country || "Bilinmiyor"}
                        </td>
                        <td className="px-6 py-5 text-violet-200">
                          {developer.websiteHost || "Yok"}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                              developer.profileStatus
                            )}`}
                          >
                            {profileStatusLabel(developer.profileStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {formatDate(developer.updatedAt ?? developer.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          {isAdmin ? (
                            <div className="flex justify-end gap-3">
                            <button
                              className="cursor-pointer rounded-lg border border-violet-400/30 px-3 py-2 text-xs font-bold text-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                loadingEditId === developer.id ||
                                deletingDeveloperId === developer.id
                              }
                              onClick={() => {
                                void openEditModal(developer.id);
                              }}
                              type="button"
                            >
                              {loadingEditId === developer.id
                                ? "Yükleniyor..."
                                : "Seç"}
                            </button>
                            <button
                              className="cursor-pointer rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                deletingDeveloperId === developer.id ||
                                loadingEditId === developer.id
                              }
                              onClick={() => {
                                requestDeleteDeveloper(developer);
                              }}
                              type="button"
                            >
                              {deletingDeveloperId === developer.id
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
              ) : null}

              {!loading && !error && filteredDevelopers.length > 0 && viewMode === "grid" ? (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDevelopers.map((developer) => (
                    <article
                      className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-violet-400/40"
                      key={developer.id}
                      onClick={() => setSelectedDeveloper(developer)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                          {developer.initials}
                        </div>
                        <div>
                          <h2 className="font-bold text-white">{developer.name}</h2>
                          <p className="text-sm text-slate-400">
                            {developer.country || "Bilinmiyor"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm text-slate-300">
                        {developer.description || "Açıklama yok."}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                            developer.profileStatus
                          )}`}
                        >
                          {profileStatusLabel(developer.profileStatus)}
                        </span>
                        {developer.websiteHost ? (
                          <span className="rounded-lg bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-100">
                            {developer.websiteHost}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <aside className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {selectedDeveloper ? (
                <>
                  <div className="h-36 bg-[radial-gradient(circle_at_40%_30%,rgba(139,92,246,0.75),transparent_30%),linear-gradient(135deg,#1e1b4b,#020617)]" />
                  <div className="p-6">
                    <div className="-mt-20 flex items-end gap-5">
                      <div className="grid h-28 w-28 place-items-center rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-600 to-sky-600 text-3xl font-black text-white shadow-xl">
                        {selectedDeveloper.initials}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-white">
                            {selectedDeveloper.name}
                          </h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {selectedDeveloper.country || "Ülke bilgisi yok"}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Web Sitesi</dt>
                        <dd className="text-violet-200">
                          {selectedDeveloper.websiteHost || "Yok"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Ülke</dt>
                        <dd>{selectedDeveloper.country || "Bilinmiyor"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Oluşturulma</dt>
                        <dd>{formatDate(selectedDeveloper.createdAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Güncellenme</dt>
                        <dd>
                          {formatDate(
                            selectedDeveloper.updatedAt ??
                              selectedDeveloper.createdAt
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Profil</dt>
                        <dd
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                            selectedDeveloper.profileStatus
                          )}`}
                        >
                          {profileStatusLabel(selectedDeveloper.profileStatus)}
                        </dd>
                      </div>
                    </dl>

                    <section className="mt-6">
                      <h3 className="font-bold text-white">
                        {selectedDeveloper.name} hakkında
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {selectedDeveloper.description || "Açıklama yok."}
                      </p>
                    </section>

                    {selectedDeveloper.websiteUrl ? (
                      <a
                        className="mt-6 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                        href={selectedDeveloper.websiteUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Web Sitesini Aç
                      </a>
                    ) : (
                      <button
                        className="mt-6 inline-flex h-14 w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-base font-bold text-slate-400"
                        disabled
                        type="button"
                      >
                        Web sitesi yok
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid min-h-[520px] place-items-center p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Geliştirici seçilmedi
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Detayları görmek için listeden bir geliştirici seçin.
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
          <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {formMode === "edit" ? "Geliştiriciyi Düzenle" : "Geliştirici Ekle"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {formMode === "edit"
                    ? "Sunucu API ile geliştirici kaydını güncelle."
                    : "Sunucu API ile yeni geliştirici kaydı oluştur."}
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
                void handleSaveDeveloper();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Geliştirici Adı
                </span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={150}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Studio adı"
                  required
                  value={formValue.name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Açıklama</span>
                <textarea
                  className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={1000}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Geliştirici açıklaması"
                  value={formValue.description ?? ""}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Web Sitesi URL
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setField("websiteUrl", event.target.value)
                    }
                    placeholder="https://studio.example"
                    value={formValue.websiteUrl ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Logo URL</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={500}
                    onChange={(event) =>
                      setField("logoUrl", event.target.value)
                    }
                    placeholder="https://studio.example/logo.png"
                    value={formValue.logoUrl ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Ülke</span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                    maxLength={100}
                    onChange={(event) => setField("country", event.target.value)}
                    placeholder="Türkiye"
                    value={formValue.country ?? ""}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">
                    Founded Date
                  </span>
                  <input
                    className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-violet-400/70"
                    onChange={(event) =>
                      setField("foundedDate", event.target.value)
                    }
                    type="date"
                    value={formValue.foundedDate ?? ""}
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
                      ? "Geliştiriciyi Güncelle"
                      : "Geliştirici Ekle"}
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
        description="Bu geliştirici kaydı kalıcı olarak silinecek. Devam etmek istiyor musunuz?"
        isDeleting={deletingDeveloperId !== null}
        isOpen={developerToDelete !== null}
        itemName={developerToDelete?.name}
        onCancel={closeDeleteModal}
        onConfirm={() => {
          void confirmDeleteDeveloper();
        }}
        title="Geliştiriciyi Sil"
      />
    </div>
  );
};

export default GameDevelopersPage;
