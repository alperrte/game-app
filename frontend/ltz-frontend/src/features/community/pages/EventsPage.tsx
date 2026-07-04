import { useEffect, useState, type FormEvent } from "react";
import {
  Ban,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Sparkles,
  TicketCheck,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { communityService } from "../services/communityService";
import type {
  Community,
  CommunityEvent,
  CommunityEventCreateRequest,
} from "../types/community.types";
import { useToast } from "../../../components/ui/toastContext";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { CoverImageField } from "../components/CoverImageField";
import { getImageUrl } from "../../user/utils/profileImage";

const EMPTY_EVENT: CommunityEventCreateRequest = {
  title: "",
  description: "",
  eventType: "GAME_NIGHT",
  location: "",
  imageUrl: "",
  startsAt: "",
  endsAt: "",
  capacity: 32,
};

const PAGE_SIZE = 12;

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const offsetInMilliseconds = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetInMilliseconds)
    .toISOString()
    .slice(0, 16);
}

const EVENT_TYPE_LABELS = {
  GAME_NIGHT: "Oyun gecesi",
  TOURNAMENT: "Turnuva",
  MEETUP: "Buluşma",
} as const;

function formatEventDate(value: string) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("tr-TR", { day: "2-digit" }),
    month: date.toLocaleDateString("tr-TR", { month: "short" }).replace(".", ""),
    weekday: date.toLocaleDateString("tr-TR", { weekday: "long" }),
    time: date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const { showToast } = useToast();
  const joinedEventCount = events.filter((event) => event.joinedByCurrentUser).length;
  const tournamentCount = events.filter((event) => event.eventType === "TOURNAMENT").length;

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      try {
        const [upcoming, mine] = await Promise.all([
          communityService.getUpcomingEvents(0, PAGE_SIZE),
          communityService.getMyCommunities(),
        ]);
        if (!active) return;
        setEvents(upcoming);
        setPage(0);
        setHasMore(upcoming.length === PAGE_SIZE);
        const owned = mine.filter((item) => item.ownedByCurrentUser);
        setOwnedCommunities(owned);
        setCommunityId((current) => current ?? owned[0]?.id ?? null);
      } catch (error) {
        if (active) showToast(getErrorMessage(error, "Etkinlikler yüklenemedi."), "error");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [showToast]);

  async function loadMoreEvents() {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const loaded = await communityService.getUpcomingEvents(
        nextPage,
        PAGE_SIZE,
      );
      setEvents((current) => {
        const merged = new Map(current.map((item) => [item.id, item]));
        loaded.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values()).sort(
          (first, second) =>
            new Date(first.startsAt).getTime() -
            new Date(second.startsAt).getTime(),
        );
      });
      setPage(nextPage);
      setHasMore(loaded.length === PAGE_SIZE);
    } catch (error) {
      showToast(getErrorMessage(error, "Daha fazla etkinlik yüklenemedi."), "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function submitEvent(event: FormEvent) {
    event.preventDefault();
    if (!communityId) return;
    try {
      const request = {
        ...form,
        startsAt: `${form.startsAt}:00`,
        endsAt: form.endsAt ? `${form.endsAt}:00` : undefined,
      };
      const saved = editingEventId
        ? await communityService.updateEvent(editingEventId, request)
        : await communityService.createEvent(communityId, request);

      setEvents((current) => {
        const nextEvents = editingEventId
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved];

        return nextEvents.sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
      });
      setForm(EMPTY_EVENT);
      setEditingEventId(null);
      setShowCreate(false);
      showToast(
        editingEventId ? "Etkinlik güncellendi." : "Etkinlik oluşturuldu.",
        "success",
      );
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          editingEventId
            ? "Etkinlik güncellenemedi."
            : "Etkinlik oluşturulamadı.",
        ),
        "error",
      );
    }
  }

  function openCreateForm() {
    const wasEditing = editingEventId !== null;
    setEditingEventId(null);
    setForm(EMPTY_EVENT);
    setShowCreate((value) => (wasEditing ? true : !value));
  }

  function openEditForm(item: CommunityEvent) {
    setEditingEventId(item.id);
    setCommunityId(item.communityId);
    setForm({
      title: item.title,
      description: item.description,
      eventType: item.eventType,
      location: item.location ?? "",
      imageUrl: item.imageUrl ?? "",
      startsAt: toDateTimeLocal(item.startsAt),
      endsAt: item.endsAt ? toDateTimeLocal(item.endsAt) : "",
      capacity: item.capacity ?? undefined,
    });
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cancelEvent(item: CommunityEvent) {
    if (!window.confirm(`"${item.title}" etkinliğini iptal etmek istiyor musun?`)) {
      return;
    }

    setBusyId(item.id);
    try {
      await communityService.cancelEvent(item.id);
      setEvents((current) => current.filter((event) => event.id !== item.id));
      showToast("Etkinlik iptal edildi.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Etkinlik iptal edilemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteEvent(item: CommunityEvent) {
    if (!window.confirm(`"${item.title}" etkinliği kalıcı olarak silinsin mi?`)) {
      return;
    }

    setBusyId(item.id);
    try {
      await communityService.deleteEvent(item.id);
      setEvents((current) => current.filter((event) => event.id !== item.id));
      showToast("Etkinlik silindi.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Etkinlik silinemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleParticipation(item: CommunityEvent) {
    setBusyId(item.id);
    try {
      if (item.joinedByCurrentUser) {
        await communityService.leaveEvent(item.id);
        setEvents((current) =>
          current.map((event) =>
            event.id === item.id
              ? { ...event, joinedByCurrentUser: false, participantCount: event.participantCount - 1 }
              : event,
          ),
        );
      } else {
        const updated = await communityService.joinEvent(item.id);
        setEvents((current) =>
          current.map((event) => (event.id === item.id ? updated : event)),
        );
      }
    } catch (error) {
      showToast(getErrorMessage(error, "Katılım işlemi tamamlanamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/25 bg-[#090b16] p-7 shadow-2xl shadow-black/20 md:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.22),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(124,58,237,0.2),transparent_38%)]" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" /> Etkinlik Alanı
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              Bir sonraki oyun anını <span className="text-fuchsia-300">kaçırma.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              Topluluk turnuvalarını, oyun gecelerini ve buluşmaları keşfet; takımınla yerini erkenden ayır.
            </p>
          </div>
          <button className="rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={ownedCommunities.length === 0} onClick={openCreateForm}>
            {showCreate && !editingEventId ? "Formu kapat" : "+ Etkinlik oluştur"}
          </button>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-2xl font-black text-white">{events.length}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Yaklaşan etkinlik</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-2xl font-black text-white">{tournamentCount}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Aktif turnuva</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-2xl font-black text-fuchsia-300">{joinedEventCount}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Katıldığın etkinlik</p>
          </div>
        </div>
      </section>

      {showCreate ? (
        <form className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:grid-cols-2" onSubmit={submitEvent}>
          <select className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white disabled:opacity-60" disabled={editingEventId !== null} required value={communityId ?? ""} onChange={(e) => setCommunityId(Number(e.target.value))}>
            {ownedCommunities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
          </select>
          <select className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as CommunityEventCreateRequest["eventType"] })}>
            <option value="GAME_NIGHT">Oyun gecesi</option>
            <option value="TOURNAMENT">Turnuva</option>
            <option value="MEETUP">Buluşma</option>
          </select>
          <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white md:col-span-2" placeholder="Etkinlik başlığı" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white md:col-span-2" placeholder="Etkinlik detayları" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white" type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white" placeholder="Konum / Discord odası" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white" min={1} type="number" value={form.capacity ?? ""} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || undefined })} />
          <CoverImageField
            accent="fuchsia"
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            value={form.imageUrl}
          />
          <div className="flex gap-3 md:col-span-2">
            <button className="flex-1 rounded-xl bg-fuchsia-600 px-5 py-3 font-bold text-white" disabled={!form.title || !form.description || !form.startsAt}>
              {editingEventId ? "Değişiklikleri kaydet" : "Yayınla"}
            </button>
            {editingEventId ? (
              <button
                className="rounded-xl border border-zinc-700 px-5 py-3 font-bold text-zinc-300"
                onClick={() => {
                  setEditingEventId(null);
                  setForm(EMPTY_EVENT);
                  setShowCreate(false);
                }}
                type="button"
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {ownedCommunities.length === 0 ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          Etkinlik oluşturmak için önce sahibi olduğun bir topluluk oluşturmalısın.
        </p>
      ) : null}

      {loading ? <p className="text-zinc-400">Etkinlikler yükleniyor...</p> : (
        <section className="grid gap-5 lg:grid-cols-2">
          {events.map((item) => {
            const isFull = item.capacity != null && item.participantCount >= item.capacity;
            const capacityRate = item.capacity
              ? Math.min(100, Math.round((item.participantCount / item.capacity) * 100))
              : 0;
            const eventDate = formatEventDate(item.startsAt);
            const canManage = ownedCommunities.some(
              (community) => community.id === item.communityId,
            );
            return (
              <article
                className="group cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-[#090d17] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-fuchsia-500/35 hover:shadow-fuchsia-950/20"
                key={item.id}
                onClick={() => setSelectedEvent(item)}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-fuchsia-800/50 via-violet-900/40 to-[#0b1020] bg-cover bg-center" style={item.imageUrl ? { backgroundImage: `linear-gradient(to top, rgba(9,13,23,.92), rgba(9,13,23,.05)), url(${getImageUrl(item.imageUrl)})` } : undefined}>
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                      {EVENT_TYPE_LABELS[item.eventType]}
                    </span>
                    {item.joinedByCurrentUser ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1.5 text-[11px] font-black text-emerald-950">
                        <TicketCheck className="h-3.5 w-3.5" /> Katılıyorsun
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute bottom-4 left-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-black/60 text-center backdrop-blur-md">
                    <span>
                      <span className="block text-2xl font-black leading-none text-white">{eventDate.day}</span>
                      <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-fuchsia-300">{eventDate.month}</span>
                    </span>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-fuchsia-300">{item.communityName}</p>
                      <h2 className="mt-2 text-xl font-black leading-tight text-white transition group-hover:text-fuchsia-100">{item.title}</h2>
                    </div>
                    {item.eventType === "TOURNAMENT" ? <Trophy className="h-6 w-6 text-amber-400" /> : <CalendarDays className="h-6 w-6 text-violet-400" />}
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">{item.description}</p>
                  <div className="grid gap-2 rounded-xl border border-white/7 bg-white/[0.025] p-3 text-sm text-zinc-300 sm:grid-cols-2">
                    <p className="flex items-center gap-2 capitalize"><CalendarDays className="h-4 w-4 text-fuchsia-300" /> {eventDate.weekday}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-fuchsia-300" /> {eventDate.time}</p>
                    {item.location ? <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {item.location}</p> : null}
                    <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {item.participantCount}{item.capacity ? ` / ${item.capacity}` : ""} katılımcı</p>
                  </div>
                  {item.capacity ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                        <span>Kontenjan</span>
                        <span>{isFull ? "Dolu" : `%${capacityRate}`}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-500"}`} style={{ width: `${capacityRate}%` }} />
                      </div>
                    </div>
                  ) : null}
                  {canManage ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 px-3 py-2.5 text-sm font-bold text-violet-200 disabled:opacity-50" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); openEditForm(item); }}>
                        <Pencil className="h-4 w-4" /> Düzenle
                      </button>
                      <button className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 px-3 py-2.5 text-sm font-bold text-amber-200 disabled:opacity-50" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); void cancelEvent(item); }}>
                        <Ban className="h-4 w-4" /> İptal
                      </button>
                      <button className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-3 py-2.5 text-sm font-bold text-red-200 disabled:opacity-50" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); void deleteEvent(item); }}>
                        <Trash2 className="h-4 w-4" /> Sil
                      </button>
                    </div>
                  ) : (
                    <button className="w-full rounded-xl border border-fuchsia-500/40 px-4 py-2.5 font-bold text-fuchsia-200 disabled:opacity-50" disabled={busyId === item.id || (isFull && !item.joinedByCurrentUser)} onClick={(event) => { event.stopPropagation(); void toggleParticipation(item); }}>
                      {item.joinedByCurrentUser ? "Katılımdan ayrıl" : isFull ? "Kapasite dolu" : "Etkinliğe katıl"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!loading && hasMore ? (
        <div className="text-center">
          <button
            className="rounded-xl border border-fuchsia-500/40 px-6 py-3 font-bold text-fuchsia-200 disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => void loadMoreEvents()}
          >
            {loadingMore ? "Yükleniyor..." : "Daha fazla etkinlik yükle"}
          </button>
        </div>
      ) : null}

      {selectedEvent ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 pt-20 backdrop-blur-md"
          onClick={() => setSelectedEvent(null)}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-fuchsia-500/25 bg-[#090d16] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div
              className="relative h-64 bg-gradient-to-br from-fuchsia-700/40 to-violet-700/20 bg-cover bg-center"
              style={selectedEvent.imageUrl ? { backgroundImage: `url(${getImageUrl(selectedEvent.imageUrl)})` } : undefined}
            >
              <button
                aria-label="Detayı kapat"
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/60 text-white"
                onClick={() => setSelectedEvent(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-fuchsia-300">
                  {selectedEvent.communityName}
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {selectedEvent.title}
                </h2>
              </div>
              <p className="whitespace-pre-wrap text-zinc-300">
                {selectedEvent.description}
              </p>
              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-fuchsia-300" />
                  {new Date(selectedEvent.startsAt).toLocaleString("tr-TR")}
                </p>
                {selectedEvent.endsAt ? (
                  <p>Bitiş: {new Date(selectedEvent.endsAt).toLocaleString("tr-TR")}</p>
                ) : null}
                {selectedEvent.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-fuchsia-300" />
                    {selectedEvent.location}
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-300" />
                  {selectedEvent.participantCount}
                  {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ""} katılımcı
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
