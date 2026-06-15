import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import GameNavbar from "../components/GameNavbar";
import { publisherService } from "../services/publisherService";
import type { Publisher, PublisherRequest } from "../types/publisherTypes";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  ADMIN_ACTION_MESSAGE,
  isAdminRole,
} from "../utils/gameAdmin";

type PublisherViewMode = "grid" | "list";
type PublisherProfileStatus = "complete" | "missing";
type PublisherStatusFilter = "all" | PublisherProfileStatus;
type PublisherFormMode = "create" | "edit";
type SortOption = "newest" | "name-asc" | "name-desc";

type PublisherRow = Publisher & {
  initials: string;
  profileStatus: PublisherProfileStatus;
  websiteHost: string | null;
};

const initialForm: PublisherRequest = {
  name: "",
  description: "",
  websiteUrl: "",
  country: "",
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizePublisherRequest = (
  value: PublisherRequest
): PublisherRequest => ({
  name: value.name.trim(),
  description: emptyToNull(value.description),
  websiteUrl: emptyToNull(value.websiteUrl),
  country: emptyToNull(value.country),
});

const toPublisherFormValue = (publisher: Publisher): PublisherRequest => ({
  name: publisher.name,
  description: publisher.description ?? "",
  websiteUrl: publisher.websiteUrl ?? "",
  country: publisher.country ?? "",
});

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "PB";
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

const toPublisherRow = (publisher: Publisher): PublisherRow => {
  const profileStatus =
    publisher.description && publisher.websiteUrl && publisher.country
      ? "complete"
      : "missing";

  return {
    ...publisher,
    initials: getInitials(publisher.name),
    profileStatus,
    websiteHost: getWebsiteHost(publisher.websiteUrl),
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
      return "Bu yayıncı zaten mevcut.";
    }
  }

  return fallback;
};

const profileBadgeClass = (status: PublisherProfileStatus) => {
  return status === "complete"
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
    : "border-amber-400/20 bg-amber-500/15 text-amber-200";
};

const profileStatusLabel = (status: PublisherProfileStatus) => {
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

const GamePublishersPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const [publishers, setPublishers] = useState<PublisherRow[]>([]);
  const [selectedPublisher, setSelectedPublisher] =
    useState<PublisherRow | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState<PublisherStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<PublisherViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [deletingPublisherId, setDeletingPublisherId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<PublisherFormMode>("create");
  const [editingPublisherId, setEditingPublisherId] = useState<number | null>(
    null
  );
  const [formValue, setFormValue] = useState<PublisherRequest>(initialForm);

  const loadPublishers = async (selectFirst = true) => {
    setLoading(true);
    setError(null);

    try {
      const results = await publisherService.getPublishers();
      const nextPublishers = results.map(toPublisherRow);

      setPublishers(nextPublishers);
      setSelectedPublisher((currentPublisher) => {
        if (!selectFirst) {
          return null;
        }

        if (!currentPublisher) {
          return nextPublishers[0] ?? null;
        }

        return (
          nextPublishers.find(
            (publisher) => publisher.id === currentPublisher.id
          ) ??
          nextPublishers[0] ??
          null
        );
      });
    } catch (publisherError) {
      setPublishers([]);
      setSelectedPublisher(null);
      setError(
        getErrorMessage(
          publisherError,
          "Yayıncılar yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialPublishers = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await publisherService.getPublishers();

        if (!active) {
          return;
        }

        const nextPublishers = results.map(toPublisherRow);
        setPublishers(nextPublishers);
        setSelectedPublisher(nextPublishers[0] ?? null);
      } catch (publisherError) {
        if (!active) {
          return;
        }

        setPublishers([]);
        setSelectedPublisher(null);
        setError(
          getErrorMessage(
            publisherError,
            "Yayıncılar yüklenirken bir hata oluştu."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInitialPublishers();

    return () => {
      active = false;
    };
  }, []);

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        publishers
          .map((publisher) => publisher.country)
          .filter((nextCountry): nextCountry is string => Boolean(nextCountry))
      )
    ).sort((leftCountry, rightCountry) =>
      leftCountry.localeCompare(rightCountry, "tr")
    );
  }, [publishers]);

  const stats = useMemo(() => {
    const countriesRepresented = new Set(
      publishers
        .map((publisher) => publisher.country)
        .filter((nextCountry): nextCountry is string => Boolean(nextCountry))
    ).size;
    const websiteCount = publishers.filter(
      (publisher) => publisher.websiteUrl
    ).length;
    const completeProfiles = publishers.filter(
      (publisher) => publisher.profileStatus === "complete"
    ).length;

    return {
      completeProfiles,
      countriesRepresented,
      totalPublishers: publishers.length,
      websiteCount,
    };
  }, [publishers]);

  const filteredPublishers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr");

    const filtered = publishers.filter((publisher) => {
      const searchableText = [
        publisher.name,
        publisher.description,
        publisher.country,
        publisher.websiteUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCountry = country === "all" || publisher.country === country;
      const matchesStatus =
        status === "all" || publisher.profileStatus === status;

      return matchesSearch && matchesCountry && matchesStatus;
    });

    return [...filtered].sort((leftPublisher, rightPublisher) => {
      if (sortBy === "name-asc") {
        return leftPublisher.name.localeCompare(rightPublisher.name, "tr");
      }

      if (sortBy === "name-desc") {
        return rightPublisher.name.localeCompare(leftPublisher.name, "tr");
      }

      return rightPublisher.createdAt.localeCompare(leftPublisher.createdAt);
    });
  }, [country, publishers, search, sortBy, status]);

  const openCreateModal = () => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setFormValue(initialForm);
    setFormError(null);
    setFormMode("create");
    setEditingPublisherId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormValue(initialForm);
    setFormError(null);
    setFormMode("create");
    setEditingPublisherId(null);
    setSelectedPublisher(null);
    setSaving(false);
  };

  const openEditModal = async (publisherId: number) => {
    if (!isAdmin) {
      setNotice(ADMIN_ACTION_MESSAGE);
      return;
    }

    setLoadingEditId(publisherId);
    setFormError(null);
    setNotice(null);

    try {
      const publisher = await publisherService.getPublisherById(publisherId);
      const publisherRow = toPublisherRow(publisher);

      setSelectedPublisher(publisherRow);
      setFormValue(toPublisherFormValue(publisher));
      setFormMode("edit");
      setEditingPublisherId(publisher.id);
      setIsModalOpen(true);
    } catch (editLoadError) {
      setError(
        getErrorMessage(
          editLoadError,
          "Yayıncı bilgileri yüklenirken bir hata oluştu."
        )
      );
    } finally {
      setLoadingEditId(null);
    }
  };

  const setField = <TKey extends keyof PublisherRequest>(
    key: TKey,
    value: PublisherRequest[TKey]
  ) => {
    setFormValue((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const handleSavePublisher = async () => {
    if (!isAdmin) {
      setFormError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const request = normalizePublisherRequest(formValue);

    if (!request.name) {
      setFormError("Yayıncı adı zorunludur.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (formMode === "edit") {
        if (editingPublisherId === null) {
          setFormError("Düzenlenecek yayıncı bulunamadı.");
          return;
        }

        await publisherService.updatePublisher(editingPublisherId, request);
      } else {
        await publisherService.createPublisher(request);
      }

      closeModal();
      setNotice(
        formMode === "edit"
          ? "Yayıncı başarıyla güncellendi."
          : "Yayıncı başarıyla eklendi."
      );
      await loadPublishers(false);
    } catch (saveError) {
      setFormError(
        getFormErrorMessage(
          saveError,
          formMode === "edit"
            ? "Yayıncı güncellenirken bir hata oluştu."
            : "Yayıncı eklenirken bir hata oluştu."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePublisher = async (publisher: PublisherRow) => {
    if (!isAdmin) {
      setError(ADMIN_ACTION_MESSAGE);
      return;
    }

    const confirmed = window.confirm(
      `${publisher.name} yayıncısını silmek istediğinizden emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    const wasSelectedPublisher = selectedPublisher?.id === publisher.id;

    setDeletingPublisherId(publisher.id);
    setError(null);
    setNotice(null);

    try {
      await publisherService.deletePublisher(publisher.id);

      if (wasSelectedPublisher) {
        setSelectedPublisher(null);
      }

      await loadPublishers(!wasSelectedPublisher);
      setNotice("Yayıncı başarıyla silindi.");
    } catch (deleteError) {
      setError(
        getFormErrorMessage(
          deleteError,
          "Yayıncı silinirken bir hata oluştu."
        )
      );
    } finally {
      setDeletingPublisherId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,28,255,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

      <div className="relative min-h-screen">
        <GameNavbar activeItem="Publishers" />

        <main className="mx-auto max-w-[1840px] px-8 py-7">
          <section className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-4xl text-violet-300">
                P
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  Oyun Yayıncıları
                </h1>
                <p className="mt-2 text-base text-slate-400">
                  Sunucu API üzerinden yayıncıları yönet.
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
                Yayıncı Ekle
              </button>
            ) : null}
          </section>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatCard
              accent="bg-violet-500/15 text-violet-300"
              helper="Sunucu kayıtları"
              icon="P"
              label="Toplam Yayıncı"
              value={String(stats.totalPublishers)}
            />
            <StatCard
              accent="bg-indigo-500/15 text-indigo-300"
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
                    placeholder="Yayıncı ara..."
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
                    setStatus(event.target.value as PublisherStatusFilter)
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

              {!loading && !error && filteredPublishers.length === 0 ? (
                <div className="grid min-h-96 place-items-center border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Yayıncı bulunamadı
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Sunucu henüz kayıt döndürmedi veya filtreler eşleşmedi.
                    </p>
                  </div>
                </div>
              ) : null}

              {!loading && !error && filteredPublishers.length > 0 && viewMode === "list" ? (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Yayıncı</th>
                      <th className="px-6 py-4">Ülke</th>
                      <th className="px-6 py-4">Web Sitesi</th>
                      <th className="px-6 py-4">Profil</th>
                      <th className="px-6 py-4">Güncellenme</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPublishers.map((publisher) => (
                      <tr
                        className={`border-b border-white/10 ${
                          selectedPublisher?.id === publisher.id
                            ? "outline outline-1 outline-violet-500"
                            : ""
                        }`}
                        key={publisher.id}
                      >
                        <td className="px-6 py-5">
                          <button
                            className="flex cursor-pointer items-center gap-4 text-left"
                            onClick={() => setSelectedPublisher(publisher)}
                            type="button"
                          >
                            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                              {publisher.initials}
                            </span>
                            <span>
                              <span className="font-bold text-white">
                                {publisher.name}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-sm text-slate-400">
                                {publisher.description || "Açıklama yok."}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {publisher.country || "Bilinmiyor"}
                        </td>
                        <td className="px-6 py-5 text-violet-200">
                          {publisher.websiteHost || "Yok"}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                              publisher.profileStatus
                            )}`}
                          >
                            {profileStatusLabel(publisher.profileStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {formatDate(publisher.updatedAt ?? publisher.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          {isAdmin ? (
                            <div className="flex justify-end gap-3">
                            <button
                              className="cursor-pointer rounded-lg border border-violet-400/30 px-3 py-2 text-xs font-bold text-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                loadingEditId === publisher.id ||
                                deletingPublisherId === publisher.id
                              }
                              onClick={() => {
                                void openEditModal(publisher.id);
                              }}
                              type="button"
                            >
                              {loadingEditId === publisher.id
                                ? "Yükleniyor..."
                                : "Seç"}
                            </button>
                            <button
                              className="cursor-pointer rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                deletingPublisherId === publisher.id ||
                                loadingEditId === publisher.id
                              }
                              onClick={() => {
                                void handleDeletePublisher(publisher);
                              }}
                              type="button"
                            >
                              {deletingPublisherId === publisher.id
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

              {!loading && !error && filteredPublishers.length > 0 && viewMode === "grid" ? (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPublishers.map((publisher) => (
                    <article
                      className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-violet-400/40"
                      key={publisher.id}
                      onClick={() => setSelectedPublisher(publisher)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-lg font-black text-white">
                          {publisher.initials}
                        </div>
                        <div>
                          <h2 className="font-bold text-white">{publisher.name}</h2>
                          <p className="text-sm text-slate-400">
                            {publisher.country || "Bilinmiyor"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm text-slate-300">
                        {publisher.description || "Açıklama yok."}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                            publisher.profileStatus
                          )}`}
                        >
                          {profileStatusLabel(publisher.profileStatus)}
                        </span>
                        {publisher.websiteHost ? (
                          <span className="rounded-lg bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-100">
                            {publisher.websiteHost}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <aside className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {selectedPublisher ? (
                <>
                  <div className="h-36 bg-[radial-gradient(circle_at_40%_30%,rgba(139,92,246,0.75),transparent_30%),linear-gradient(135deg,#1e1b4b,#020617)]" />
                  <div className="p-6">
                    <div className="-mt-20 flex items-end gap-5">
                      <div className="grid h-28 w-28 place-items-center rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-600 to-sky-600 text-3xl font-black text-white shadow-xl">
                        {selectedPublisher.initials}
                      </div>
                      <div className="pb-2">
                        <h2 className="text-2xl font-black text-white">
                          {selectedPublisher.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {selectedPublisher.country || "Ülke bilgisi yok"}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Web Sitesi</dt>
                        <dd className="text-violet-200">
                          {selectedPublisher.websiteHost || "Yok"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Ülke</dt>
                        <dd>{selectedPublisher.country || "Bilinmiyor"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Oluşturulma</dt>
                        <dd>{formatDate(selectedPublisher.createdAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Güncellenme</dt>
                        <dd>
                          {formatDate(
                            selectedPublisher.updatedAt ??
                              selectedPublisher.createdAt
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Profil</dt>
                        <dd
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${profileBadgeClass(
                            selectedPublisher.profileStatus
                          )}`}
                        >
                          {profileStatusLabel(selectedPublisher.profileStatus)}
                        </dd>
                      </div>
                    </dl>

                    <section className="mt-6">
                      <h3 className="font-bold text-white">
                        {selectedPublisher.name} hakkında
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {selectedPublisher.description || "Açıklama yok."}
                      </p>
                    </section>

                    {selectedPublisher.websiteUrl ? (
                      <a
                        className="mt-6 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold text-white shadow-xl shadow-violet-950/50"
                        href={selectedPublisher.websiteUrl}
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
                      Yayıncı seçilmedi
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Detayları görmek için listeden bir yayıncı seçin.
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
                  {formMode === "edit" ? "Yayıncıyı Düzenle" : "Yayıncı Ekle"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {formMode === "edit"
                    ? "Sunucu API ile yayıncı kaydını güncelle."
                    : "Sunucu API ile yeni yayıncı kaydı oluştur."}
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
                void handleSavePublisher();
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">
                  Yayıncı Adı
                </span>
                <input
                  className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
                  maxLength={150}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Yayıncı adı"
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
                  placeholder="Yayıncı açıklaması"
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
                    placeholder="https://publisher.example"
                    value={formValue.websiteUrl ?? ""}
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
                      ? "Yayıncıyı Güncelle"
                      : "Yayıncı Ekle"}
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
    </div>
  );
};

export default GamePublishersPage;
