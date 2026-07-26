import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Send,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ROUTES, SOCIAL_ROUTES } from "../../../lib/constants";
import { useToast } from "../../../components/ui/toastContext";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { CoverImageField } from "../components/CoverImageField";
import { toCommunityUpdateForm } from "../utils/communityForm";
import { communityService } from "../services/communityService";
import type {
  Community,
  CommunityEvent,
  CommunityMember,
  CommunityUpdateRequest,
} from "../types/community.types";
import { getImageUrl } from "../../user/utils/profileImage";
import { userService } from "../../user/services/userService";
import type { UserProfileResponse } from "../../user/types/user";
import { socialService } from "../../social/services/socialService";
import type { SocialPostResponse } from "../../social/types/social.types";
import { SocialPostFeedList } from "../../social/components/SocialPostFeedList";

export default function CommunityDetailPage() {
  const { communityId: communityIdParam } = useParams<{ communityId: string }>();
  const communityId = Number(communityIdParam);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(() => Number.isFinite(communityId));
  const [notFound, setNotFound] = useState(() => !Number.isFinite(communityId));
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CommunityUpdateRequest | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<
    Map<number, UserProfileResponse>
  >(new Map());
  const [membersLoading, setMembersLoading] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<SocialPostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");

  useEffect(() => {
    if (!Number.isFinite(communityId)) {
      return;
    }

    let active = true;
    void Promise.resolve().then(async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const loaded = await communityService.getCommunityById(communityId);
        if (!active) return;
        setCommunity(loaded);
        setEditForm(toCommunityUpdateForm(loaded));
      } catch (error) {
        if (active) {
          showToast(getErrorMessage(error, "Topluluk yüklenemedi."), "error");
          setNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [communityId, showToast]);

  useEffect(() => {
    if (!community) return;

    let active = true;
    void Promise.resolve().then(async () => {
      setEventsLoading(true);
      setPostsLoading(true);
      setMembersLoading(true);

      try {
        const [events, posts] = await Promise.all([
          communityService.getCommunityEvents(community.id, 0, 8),
          community.joinedByCurrentUser
            ? socialService.getCommunityPosts(community.id, { page: 0, size: 10 })
            : Promise.resolve<SocialPostResponse[]>([]),
        ]);
        if (!active) return;
        setCommunityEvents(events);
        setCommunityPosts(posts);
      } catch (error) {
        if (active) {
          showToast(
            getErrorMessage(error, "Topluluk içeriği yüklenemedi."),
            "error",
          );
        }
      } finally {
        if (active) {
          setEventsLoading(false);
          setPostsLoading(false);
        }
      }

      if (!community.ownedByCurrentUser && !community.membersVisible) {
        if (active) setMembersLoading(false);
        return;
      }

      try {
        const loadedMembers = await communityService.getCommunityMembers(
          community.id,
        );
        const profiles = await userService.getProfilesBatch(
          loadedMembers.map((member) => String(member.userId)),
        );
        if (!active) return;
        setMembers(loadedMembers);
        setMemberProfiles(
          new Map(profiles.map((profile) => [Number(profile.userId), profile])),
        );
      } catch (error) {
        if (active) {
          showToast(getErrorMessage(error, "Üye listesi yüklenemedi."), "error");
        }
      } finally {
        if (active) setMembersLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [community, showToast]);

  async function reloadMembers() {
    if (!community) return;
    const loadedMembers = await communityService.getCommunityMembers(community.id);
    const profiles = await userService.getProfilesBatch(
      loadedMembers.map((member) => String(member.userId)),
    );
    setMembers(loadedMembers);
    setMemberProfiles(
      new Map(profiles.map((profile) => [Number(profile.userId), profile])),
    );
  }

  async function toggleMembership() {
    if (!community) return;
    setBusyId(community.id);
    try {
      if (community.joinedByCurrentUser) {
        await communityService.leaveCommunity(community.id);
        const updated = {
          ...community,
          joinedByCurrentUser: false,
          memberCount: Math.max(0, community.memberCount - 1),
        };
        setCommunity(updated);
        setCommunityPosts([]);
        showToast("Topluluktan ayrıldın.", "success");
      } else {
        const updated = await communityService.joinCommunity(community.id);
        setCommunity(updated);
        const posts = await socialService.getCommunityPosts(community.id, {
          page: 0,
          size: 10,
        });
        setCommunityPosts(posts);
        showToast("Topluluğa katıldın.", "success");
      }
    } catch (error) {
      showToast(getErrorMessage(error, "Üyelik işlemi tamamlanamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function inviteMember() {
    if (!community || !inviteUsername.trim()) return;
    setBusyId(community.id);
    try {
      const profile = await userService.getProfileByUsername(inviteUsername.trim());
      await communityService.inviteMember(community.id, Number(profile.userId));
      setInviteUsername("");
      showToast("Topluluk daveti gönderildi.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Topluluk daveti gönderilemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(member: CommunityMember) {
    if (!community) return;
    const profile = memberProfiles.get(member.userId);
    const name =
      profile?.displayName || profile?.username || `Oyuncu #${member.userId}`;
    if (!window.confirm(`${name} topluluktan çıkarılsın mı?`)) return;

    setBusyId(community.id);
    try {
      await communityService.removeMember(community.id, member.userId);
      await reloadMembers();
      setCommunity({
        ...community,
        memberCount: Math.max(1, community.memberCount - 1),
      });
      showToast("Üye topluluktan çıkarıldı.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Üye çıkarılamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function transferOwnership(member: CommunityMember) {
    if (!community) return;
    const profile = memberProfiles.get(member.userId);
    const name =
      profile?.displayName || profile?.username || `Oyuncu #${member.userId}`;
    if (!window.confirm(`Topluluk sahipliği ${name} kullanıcısına devredilsin mi?`)) {
      return;
    }

    setBusyId(community.id);
    try {
      const updated = await communityService.transferOwnership(
        community.id,
        member.userId,
      );
      setCommunity(updated);
      setEditForm(toCommunityUpdateForm(updated));
      await reloadMembers();
      showToast("Topluluk sahipliği devredildi.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Sahiplik devredilemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCommunity() {
    if (!community) return;
    if (
      !window.confirm(
        `"${community.name}" topluluğu, etkinlikleri ve gönderileri kalıcı olarak silinsin mi?`,
      )
    ) {
      return;
    }

    setBusyId(community.id);
    try {
      await communityService.deleteCommunity(community.id);
      showToast("Topluluk silindi.", "success");
      navigate(SOCIAL_ROUTES.communities);
    } catch (error) {
      showToast(getErrorMessage(error, "Topluluk silinemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEventParticipation(event: CommunityEvent) {
    setBusyId(event.id);
    try {
      if (event.joinedByCurrentUser) {
        await communityService.leaveEvent(event.id);
        setCommunityEvents((current) =>
          current.map((item) =>
            item.id === event.id
              ? {
                  ...item,
                  joinedByCurrentUser: false,
                  participantCount: Math.max(0, item.participantCount - 1),
                }
              : item,
          ),
        );
        showToast("Etkinlik katılımından ayrıldın.", "success");
      } else {
        const updated = await communityService.joinEvent(event.id);
        setCommunityEvents((current) =>
          current.map((item) => (item.id === event.id ? updated : item)),
        );
        showToast("Etkinliğe katıldın.", "success");
      }
    } catch (error) {
      showToast(getErrorMessage(error, "Katılım işlemi tamamlanamadı."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function submitUpdate(event: FormEvent) {
    event.preventDefault();
    if (!community || !editForm) return;

    setBusyId(community.id);
    try {
      const updated = await communityService.updateCommunity(
        community.id,
        editForm,
      );
      setCommunity(updated);
      setEditForm(toCommunityUpdateForm(updated));
      showToast("Topluluk ayarları güncellendi.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Topluluk güncellenemedi."), "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    );
  }

  if (notFound || !community) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-center">
        <p className="text-lg text-zinc-300">Topluluk bulunamadı.</p>
        <Link
          className="inline-flex rounded-xl bg-violet-600 px-5 py-2 font-bold text-white"
          to={SOCIAL_ROUTES.communities}
        >
          Topluluklara dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        onClick={() => navigate(SOCIAL_ROUTES.communities)}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" /> Topluluklara dön
      </button>

      <section className="overflow-hidden rounded-3xl border border-violet-500/25 bg-zinc-950">
        <div
          className="h-48 bg-gradient-to-br from-violet-700/50 to-fuchsia-700/20 bg-cover bg-center sm:h-56"
          style={
            community.imageUrl
              ? { backgroundImage: `url(${getImageUrl(community.imageUrl)})` }
              : undefined
          }
        />
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                {community.category || "Genel"}
              </p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {community.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-violet-200">
                  {community.visibility === "PUBLIC" ? "Herkese açık" : "Özel"}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-zinc-300">
                  {community.memberCount} üye
                </span>
                {community.ownedByCurrentUser ? (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-200">
                    Sahibisin
                  </span>
                ) : community.joinedByCurrentUser ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-200">
                    Üyesin
                  </span>
                ) : null}
              </div>
            </div>
            {!community.ownedByCurrentUser ? (
              <button
                className="rounded-xl border border-violet-500/40 px-5 py-2.5 text-sm font-bold text-violet-200 disabled:opacity-50"
                disabled={busyId === community.id}
                onClick={() => void toggleMembership()}
                type="button"
              >
                {community.joinedByCurrentUser ? "Topluluktan ayrıl" : "Katıl"}
              </button>
            ) : null}
          </div>

          {!community.ownedByCurrentUser ? (
            <p className="whitespace-pre-wrap text-zinc-300">{community.description}</p>
          ) : null}
        </div>
      </section>

      {community.ownedByCurrentUser && editForm ? (
        <section className="rounded-2xl border border-violet-500/20 bg-zinc-950 p-6">
          <h2 className="text-lg font-black text-white">Topluluk ayarları</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitUpdate}>
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              maxLength={100}
              required
              value={editForm.name}
              onChange={(event) =>
                setEditForm({ ...editForm, name: event.target.value })
              }
            />
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              maxLength={80}
              placeholder="Kategori"
              value={editForm.category}
              onChange={(event) =>
                setEditForm({ ...editForm, category: event.target.value })
              }
            />
            <textarea
              className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white md:col-span-2"
              maxLength={1000}
              required
              value={editForm.description}
              onChange={(event) =>
                setEditForm({ ...editForm, description: event.target.value })
              }
            />
            <select
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              value={editForm.visibility}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  visibility: event.target
                    .value as CommunityUpdateRequest["visibility"],
                })
              }
            >
              <option value="PUBLIC">Herkese açık topluluk</option>
              <option value="PRIVATE">Özel topluluk</option>
            </select>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
              <span className="flex items-center gap-2">
                {editForm.membersVisible ? (
                  <Eye className="h-4 w-4 text-violet-300" />
                ) : (
                  <EyeOff className="h-4 w-4 text-zinc-500" />
                )}
                Üye listesini diğer kullanıcılara göster
              </span>
              <input
                checked={editForm.membersVisible}
                className="h-4 w-4 accent-violet-600"
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    membersVisible: event.target.checked,
                  })
                }
                type="checkbox"
              />
            </label>
            <CoverImageField
              onChange={(imageUrl) => setEditForm({ ...editForm, imageUrl })}
              value={editForm.imageUrl}
            />
            <button
              className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white md:col-span-2 disabled:opacity-50"
              disabled={busyId === community.id}
              type="submit"
            >
              Ayarları kaydet
            </button>
            <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 md:col-span-2">
              <p className="font-bold text-white">Üye davet et</p>
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white"
                  placeholder="Kullanıcı adı"
                  value={inviteUsername}
                  onChange={(event) => setInviteUsername(event.target.value)}
                />
                <button
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-50"
                  disabled={!inviteUsername.trim() || busyId === community.id}
                  onClick={() => void inviteMember()}
                  type="button"
                >
                  <Send className="h-4 w-4" /> Davet et
                </button>
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-5 py-3 font-bold text-red-200 md:col-span-2"
              onClick={() => void deleteCommunity()}
              type="button"
            >
              <Trash2 className="h-4 w-4" /> Topluluğu sil
            </button>
          </form>
        </section>
      ) : null}

      {community.joinedByCurrentUser ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-lg font-black text-white">Topluluk gönderileri</h2>
          <div className="mt-4">
            <SocialPostFeedList
              backendPosts={communityPosts}
              emptyMessage="Bu toplulukta henüz gönderi yok."
              isLoading={postsLoading}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
          Topluluk gönderilerini görmek için önce katılman gerekir.
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <CalendarDays className="h-5 w-5 text-fuchsia-300" /> Etkinlikler
          </h2>
          <Link
            className="text-xs font-semibold text-violet-400 hover:text-violet-300"
            to={SOCIAL_ROUTES.events}
          >
            Tüm etkinlikler
          </Link>
        </div>
        {eventsLoading ? (
          <p className="text-sm text-zinc-500">Etkinlikler yükleniyor...</p>
        ) : communityEvents.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {communityEvents.map((event) => {
              const isFull =
                event.capacity != null &&
                event.participantCount >= event.capacity;

              return (
              <div
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                key={event.id}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  {event.eventType === "TOURNAMENT"
                    ? "Turnuva"
                    : event.eventType === "MEETUP"
                      ? "Buluşma"
                      : "Oyun gecesi"}
                </p>
                <p className="mt-2 font-bold text-white">{event.title}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {new Date(event.startsAt).toLocaleString("tr-TR", {
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "long",
                  })}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {event.participantCount}
                  {event.capacity != null ? ` / ${event.capacity}` : ""} katılımcı
                </p>
                {community.joinedByCurrentUser ? (
                  <button
                    className="mt-4 w-full rounded-lg border border-fuchsia-500/40 px-4 py-2 text-sm font-bold text-fuchsia-200 disabled:opacity-50"
                    disabled={
                      busyId === event.id ||
                      (isFull && !event.joinedByCurrentUser)
                    }
                    onClick={() => void toggleEventParticipation(event)}
                    type="button"
                  >
                    {event.joinedByCurrentUser
                      ? "Katılımdan ayrıl"
                      : isFull
                        ? "Kapasite dolu"
                        : "Etkinliğe katıl"}
                  </button>
                ) : null}
              </div>
            );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Planlanmış etkinlik yok.</p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <Users className="h-5 w-5 text-violet-300" /> Üyeler
          </h2>
          {!community.ownedByCurrentUser && !community.membersVisible ? (
            <span className="text-xs text-zinc-500">Üye listesi gizli</span>
          ) : null}
        </div>
        {membersLoading ? (
          <p className="text-sm text-zinc-500">Üyeler yükleniyor...</p>
        ) : community.ownedByCurrentUser || community.membersVisible ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => {
              const profile = memberProfiles.get(member.userId);
              const name =
                profile?.displayName?.trim() ||
                profile?.username ||
                `Oyuncu #${member.userId}`;
              return (
                <div
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  key={member.userId}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => {
                      if (profile?.username) {
                        navigate(
                          ROUTES.profile.replace(":username", profile.username),
                        );
                      }
                    }}
                    type="button"
                  >
                    {profile?.avatarUrl ? (
                      <img
                        alt={name}
                        className="h-11 w-11 rounded-full object-cover"
                        src={getImageUrl(profile.avatarUrl)}
                      />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-700 font-black text-white">
                        {name.charAt(0).toLocaleUpperCase("tr-TR")}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-white">{name}</span>
                      <span className="text-xs text-zinc-500">
                        {profile?.username ? `@${profile.username}` : "Üye"}
                      </span>
                    </span>
                  </button>
                  {member.role === "OWNER" ? (
                    <Crown className="h-5 w-5 text-amber-400" />
                  ) : community.ownedByCurrentUser ? (
                    <span className="flex gap-1">
                      <button
                        aria-label="Sahipliği devret"
                        className="rounded-md p-2 text-amber-300 hover:bg-amber-500/10"
                        onClick={() => void transferOwnership(member)}
                        type="button"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Üyeyi çıkar"
                        className="rounded-md p-2 text-red-300 hover:bg-red-500/10"
                        onClick={() => void removeMember(member)}
                        type="button"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Topluluk sahibi üye listesini gizli tutuyor.
          </p>
        )}
      </section>
    </main>
  );
}
