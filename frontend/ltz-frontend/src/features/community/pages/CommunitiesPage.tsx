import { useEffect, useState, type FormEvent } from "react";
import { CalendarPlus, Search, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { communityService } from "../services/communityService";
import type {
  Community,
  CommunityCreateRequest,
  CommunityInvitation,
} from "../types/community.types";
import { SOCIAL_ROUTES } from "../../../lib/constants";
import { useToast } from "../../../components/ui/toastContext";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { CoverImageField } from "../components/CoverImageField";
import { getImageUrl } from "../../user/utils/profileImage";

const PAGE_SIZE = 12;

const EMPTY_FORM: CommunityCreateRequest = {
  name: "",
  description: "",
  category: "",
  imageUrl: "",
  visibility: "PUBLIC",
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      try {
        const [publicCommunities, myCommunities, pendingInvitations] =
          await Promise.all([
            communityService.getCommunities(query, 0, PAGE_SIZE),
            communityService.getMyCommunities(),
            communityService.getMyInvitations(),
          ]);
        if (!active) return;

        const merged = new Map<number, Community>();
        [...myCommunities, ...publicCommunities].forEach((community) =>
          merged.set(community.id, community),
        );
        setCommunities(Array.from(merged.values()));
        setInvitations(pendingInvitations);
        setPage(0);
        setHasMore(publicCommunities.length === PAGE_SIZE);
      } catch (error) {
        if (active) {
          showToast(getErrorMessage(error, "Topluluklar yüklenemedi."), "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query, showToast]);

  async function loadMoreCommunities() {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const loaded = await communityService.getCommunities(
        query,
        nextPage,
        PAGE_SIZE,
      );
      setCommunities((current) => {
        const merged = new Map(current.map((item) => [item.id, item]));
        loaded.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values());
      });
      setPage(nextPage);
      setHasMore(loaded.length === PAGE_SIZE);
    } catch (error) {
      showToast(getErrorMessage(error, "Daha fazla topluluk yüklenemedi."), "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    try {
      const created = await communityService.createCommunity(form);
      setCommunities((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      showToast("Topluluk oluşturuldu.", "success");
      navigate(SOCIAL_ROUTES.communityDetail(created.id));
    } catch (error) {
      showToast(getErrorMessage(error, "Topluluk oluşturulamadı."), "error");
    }
  }

  async function toggleMembership(community: Community) {
    setBusyId(community.id);
    try {
      if (community.joinedByCurrentUser) {
        await communityService.leaveCommunity(community.id);
        setCommunities((current) =>
          current.map((item) =>
            item.id === community.id
              ? {
                  ...item,
                  joinedByCurrentUser: false,
                  memberCount: Math.max(0, item.memberCount - 1),
                }
              : item,
          ),
        );
      } else {
        const updated = await communityService.joinCommunity(community.id);
        setCommunities((current) =>
          current.map((item) => (item.id === community.id ? updated : item)),
        );
      }
    } catch (error) {
      showToast(getErrorMessage(error, "Üyelik işlemi tamamlanamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function respondToInvitation(
    invitation: CommunityInvitation,
    accept: boolean,
  ) {
    setBusyId(invitation.communityId);
    try {
      if (accept) {
        const joined = await communityService.acceptInvitation(invitation.id);
        setCommunities((current) => [
          joined,
          ...current.filter((item) => item.id !== joined.id),
        ]);
        showToast("Topluluk daveti kabul edildi.", "success");
        navigate(SOCIAL_ROUTES.communityDetail(joined.id));
      } else {
        await communityService.rejectInvitation(invitation.id);
        showToast("Topluluk daveti reddedildi.", "success");
      }
      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );
    } catch (error) {
      showToast(getErrorMessage(error, "Davet yanıtlanamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  function openCommunityDetail(community: Community) {
    navigate(SOCIAL_ROUTES.communityDetail(community.id));
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/80 via-zinc-950 to-fuchsia-950/50 p-8">
        <div className="max-w-3xl">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">
            Topluluk Merkezi
          </span>
          <h1 className="mt-3 text-4xl font-black text-white">
            Birlikte oyna, topluluğunu kur.
          </h1>
          <p className="mt-3 text-zinc-300">
            Oyuncu topluluklarına katıl, kendi ekibini oluştur ve etkinlikleri tek
            yerden yönet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-500"
              onClick={() => setShowCreate((value) => !value)}
              type="button"
            >
              Topluluk oluştur
            </button>
            <button
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 font-bold text-zinc-200 hover:bg-white/5"
              onClick={() => navigate(SOCIAL_ROUTES.events)}
              type="button"
            >
              <CalendarPlus className="h-4 w-4" /> Etkinlikleri gör
            </button>
          </div>
        </div>
      </section>

      {invitations.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h2 className="text-lg font-black text-white">Topluluk davetleri</h2>
          {invitations.map((invitation) => (
            <div
              className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
              key={invitation.id}
            >
              <div>
                <p className="font-bold text-white">{invitation.communityName}</p>
                <p className="text-sm text-zinc-400">
                  Bu özel topluluğa davet edildin.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white"
                  disabled={busyId === invitation.communityId}
                  onClick={() => void respondToInvitation(invitation, true)}
                  type="button"
                >
                  Kabul et
                </button>
                <button
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300"
                  disabled={busyId === invitation.communityId}
                  onClick={() => void respondToInvitation(invitation, false)}
                  type="button"
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {showCreate ? (
        <form
          className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:grid-cols-2"
          onSubmit={submitCreate}
        >
          <input
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
            maxLength={100}
            placeholder="Topluluk adı"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
            maxLength={80}
            placeholder="Kategori (FPS, RPG...)"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
          <textarea
            className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white md:col-span-2"
            maxLength={1000}
            placeholder="Topluluğu anlat"
            required
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <select
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
            value={form.visibility}
            onChange={(event) =>
              setForm({
                ...form,
                visibility: event.target.value as CommunityCreateRequest["visibility"],
              })
            }
          >
            <option value="PUBLIC">Herkese açık</option>
            <option value="PRIVATE">Özel</option>
          </select>
          <CoverImageField
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            value={form.imageUrl}
          />
          <button
            className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white md:col-span-2"
            disabled={!form.name || !form.description}
            type="submit"
          >
            Oluştur
          </button>
        </form>
      ) : null}

      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-4 text-white"
          placeholder="Topluluk ara..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-zinc-400">Topluluklar yükleniyor...</p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {communities.map((community) => (
            <article
              className="cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:border-violet-500/40"
              key={community.id}
              onClick={() => openCommunityDetail(community)}
            >
              <div
                className="h-36 bg-gradient-to-br from-violet-700/50 to-fuchsia-700/20 bg-cover bg-center"
                style={
                  community.imageUrl
                    ? {
                        backgroundImage: `url(${getImageUrl(community.imageUrl)})`,
                      }
                    : undefined
                }
              />
              <div className="space-y-4 p-5">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-white">
                      {community.name}
                    </h2>
                    {community.ownedByCurrentUser ? (
                      <Settings className="h-5 w-5 text-amber-400" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-violet-300">
                    {community.category || "Genel"}
                  </p>
                </div>
                <p className="line-clamp-3 text-sm text-zinc-400">
                  {community.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-300">
                    <Users className="h-4 w-4" /> {community.memberCount} üye
                  </span>
                  <button
                    className="rounded-lg border border-violet-500/40 px-4 py-2 text-sm font-bold text-violet-200 disabled:opacity-50"
                    disabled={busyId === community.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (community.ownedByCurrentUser) {
                        openCommunityDetail(community);
                      } else {
                        void toggleMembership(community);
                      }
                    }}
                    type="button"
                  >
                    {community.ownedByCurrentUser
                      ? "Ayarlar"
                      : community.joinedByCurrentUser
                        ? "Ayrıl"
                        : "Katıl"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && hasMore ? (
        <div className="text-center">
          <button
            className="rounded-xl border border-violet-500/40 px-6 py-3 font-bold text-violet-200 disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => void loadMoreCommunities()}
            type="button"
          >
            {loadingMore ? "Yükleniyor..." : "Daha fazla topluluk yükle"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
