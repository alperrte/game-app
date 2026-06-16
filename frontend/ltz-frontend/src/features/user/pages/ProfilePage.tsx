import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { UserProfileResponse } from "../types/user";
import { EditProfileModal } from "../components/EditProfileModal";
import { ConnectedAccountsTab } from "../components/ConnectedAccountsTab";
import { PrivacySettingsTab } from "../components/PrivacySettingsTab";
import { ActivityLogTab } from "../components/ActivityLogTab";
import { ProfileDevNote } from "../components/ProfileDevNote";
import { useYouTubeSoundtrack } from "../../../hooks/useYouTubeSoundtrack";
import { DEFAULT_PROFILE_COVER, getImageUrl, isImageValid } from "../utils/profileImage";
import { formatProfileDate, getGamerTypeLabel, getYouTubeVideoId, isPioneerAccount } from "../utils/profileHelpers";
import {
  Lock,
  User,
  Settings,
  Link2,
  Terminal,
  Calendar,
  Sparkles,
  Edit3,
  ChevronLeft,
  Play,
  Pause,
  Award,
  Music,
  Palette,
  Compass,
  MessageSquare,
  Gamepad2,
} from "lucide-react";

type ProfileTab = "overview" | "accounts" | "privacy" | "activity";

const isNotFoundError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && (err as { status: number }).status === 404) ||
    ("response" in err && (err as { response?: { status?: number } }).response?.status === 404));

const isForbiddenError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && (err as { status: number }).status === 403) ||
    ("response" in err && (err as { response?: { status?: number } }).response?.status === 403));

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pageLoadedAt] = useState(() => Date.now());

  const targetUsername = username || currentUser?.username;
  const currentUsername = currentUser?.username;
  const isOwnProfile = currentUsername?.toLowerCase() === targetUsername?.toLowerCase();

  const musicVideoId = profile ? getYouTubeVideoId(profile.profileMusicUrl) : null;
  const {
    containerRef: playerContainerRef,
    isPlaying,
    playerReady,
    isLoading: soundtrackLoading,
    togglePlayback,
  } = useYouTubeSoundtrack({
    videoId: musicVideoId,
    suspended: editModalOpen,
  });

  const handleProfileUpdated = (updated: UserProfileResponse) => {
    setProfile(updated);
  };

  const editModal =
    editModalOpen && profile ? (
      <EditProfileModal
        profile={profile}
        onClose={() => setEditModalOpen(false)}
        onSaveSuccess={handleProfileUpdated}
      />
    ) : null;

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    if (!targetUsername) return;

    let active = true;

    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);

      try {
        let data: UserProfileResponse;

        if (isOwnProfile) {
          try {
            data = await userService.getMyProfile();
          } catch (meErr: unknown) {
            if (!isNotFoundError(meErr)) throw meErr;
            data = await userService.setupProfile({
              displayName: currentUsername || "Gamer",
              bio: "Hoş geldiniz! Ben bir LobbyTwoZero oyuncusuyum.",
              gamerType: "CASUAL",
              favoriteCategories: "",
            });
            if (active) showToast("Profiliniz başarıyla oluşturuldu!", "success");
          }
        } else {
          data = await userService.getProfileByUsername(targetUsername);
        }

        if (active) {
          setProfile(data);
          setIsRestricted(false);
        }
      } catch (err: unknown) {
        if (!active) return;
        if (isForbiddenError(err)) {
          setIsRestricted(true);
        } else {
          showToast("Profil bulunamadı veya yüklenirken hata oluştu.", "error");
          navigateRef.current("/games");
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [targetUsername, isOwnProfile, currentUsername, showToast]);

  useEffect(() => {
    if (!profile) return;
    document.title = `LobbyTwoZero | ${profile.displayName || profile.username} Profili`;
    return () => {
      document.title = "LobbyTwoZero";
    };
  }, [profile]);

  if (loading) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
        {editModal}
      </>
    );
  }

  if (isRestricted) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative z-10 flex flex-col items-center max-w-md w-full rounded-2xl border border-rose-500/30 bg-zinc-950 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-mono text-lg font-bold tracking-[0.2em] text-rose-500 uppercase">
            ACCESS DENIED
          </h1>
          <h2 className="mt-2 text-xl font-bold text-white">Bu Profil Gizlidir</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Kullanıcı gizlilik ayarları gereği bu profilin detayları sadece kendisine ve arkadaş listesine açıktır.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-8 flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-white/[0.02] hover:bg-white/[0.05] px-5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const categoriesList = profile.favoriteCategories
    ? profile.favoriteCategories.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const isPioneer = isPioneerAccount(profile.createdAt, pageLoadedAt);

  const renderTabContent = () => {
    switch (activeTab) {
      case "accounts":
        return isOwnProfile ? <ConnectedAccountsTab /> : null;
      case "privacy":
        return isOwnProfile ? <PrivacySettingsTab /> : null;
      case "activity":
        return isOwnProfile ? <ActivityLogTab /> : null;
      default:
        return (
          <div className={`grid grid-cols-1 gap-8 ${isOwnProfile ? "md:grid-cols-3" : ""}`}>
            <div className={isOwnProfile ? "md:col-span-2 space-y-8" : "space-y-8"}>
              {/* Favori Kategoriler */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Favori Kategoriler</h3>
                {categoriesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-300 px-3 py-1 text-xs font-semibold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic">Kategori seçilmemiş.</p>
                )}
              </div>

              {/* Oyuncu Profili */}
              <div className="border-t border-zinc-900/80 pt-6 space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Oyuncu Profili</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/15 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                      Kategori Adedi
                    </span>
                    <span className="text-xl font-black text-white mt-1 block">{categoriesList.length}</span>
                  </div>
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/15 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                      Gamer Tipi
                    </span>
                    <span className="text-xs font-bold text-violet-400 tracking-wider mt-2.5 block uppercase">
                      {profile.gamerType ? getGamerTypeLabel(profile.gamerType) : "Belirlenmemiş"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Sistem Donanımı</h3>
                <div className="rounded-xl border border-violet-500/10 bg-zinc-950/40 p-5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">İşlemci (CPU)</span>
                    <p className="text-xs font-semibold text-zinc-300">{profile.hardwareCpu || "Belirtilmemiş"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ekran Kartı (GPU)</span>
                    <p className="text-xs font-semibold text-zinc-300">{profile.hardwareGpu || "Belirtilmemiş"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Bellek (RAM)</span>
                    <p className="text-xs font-semibold text-zinc-300">{profile.hardwareRam || "Belirtilmemiş"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">İşletim Sistemi</span>
                    <p className="text-xs font-semibold text-zinc-300">{profile.hardwareOs || "Belirtilmemiş"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 relative">
      {isImageValid(profile.profileBackgroundUrl) ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
          style={{ backgroundImage: `url(${getImageUrl(profile.profileBackgroundUrl)})` }}
        >
          <div className="absolute inset-0 bg-zinc-950/90" />
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl -z-10" />
          <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl -z-10" />
        </>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-zinc-950/80 shadow-lg">
        <div className="relative h-48 md:h-64 bg-zinc-950 overflow-hidden border-b border-white/5">
          <img
            src={isImageValid(profile.coverUrl) ? getImageUrl(profile.coverUrl) : DEFAULT_PROFILE_COVER}
            alt="Cover"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        </div>

        <div className="relative px-6 pb-6 pt-16 md:pt-4 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="absolute -top-16 left-6 md:left-8 z-20">
            <div
              className="h-28 w-28 md:h-32 md:w-32 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 p-[3px]"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <div
                className="h-full w-full bg-zinc-950 overflow-hidden"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              >
                {isImageValid(profile.avatarUrl) ? (
                  <img
                    src={getImageUrl(profile.avatarUrl)}
                    alt={profile.displayName || profile.username}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-violet-400 font-black text-3xl uppercase font-mono">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pl-0 md:pl-44 flex-1 space-y-3 pt-14 md:pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              <span className="text-sm font-semibold text-zinc-500">@{profile.username}</span>
              {profile.gamerType && (
                <span className="rounded border border-violet-500/40 bg-violet-600/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase">
                  {getGamerTypeLabel(profile.gamerType)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPioneer && (
                <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-bold text-amber-300 px-2.5 py-0.5">
                  <Compass className="h-3.5 w-3.5 text-amber-400" /> PIONEER
                </span>
              )}
              {profile.connectedAccounts?.some((acc) => acc.platformName.toUpperCase() === "STEAM") && (
                <span className="flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/10 text-[9px] font-bold text-sky-300 px-2.5 py-0.5">
                  <Gamepad2 className="h-3.5 w-3.5 text-sky-400" /> STEAM SYNC
                </span>
              )}
              {profile.connectedAccounts?.some((acc) => acc.platformName.toUpperCase() === "DISCORD") && (
                <span className="flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-[9px] font-bold text-indigo-300 px-2.5 py-0.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> DISCORD
                </span>
              )}
              {profile.profileMusicUrl && (
                <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-bold text-emerald-300 px-2.5 py-0.5">
                  <Music className="h-3.5 w-3.5 text-emerald-400" /> AUDIOPHILE
                </span>
              )}
              {profile.profileBackgroundUrl && (
                <span className="flex items-center gap-1 rounded border border-fuchsia-500/30 bg-fuchsia-500/10 text-[9px] font-bold text-fuchsia-300 px-2.5 py-0.5">
                  <Palette className="h-3.5 w-3.5 text-fuchsia-400" /> CUSTOMIZER
                </span>
              )}
              {isOwnProfile && (
                <span className="flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 text-[9px] font-bold text-rose-300 px-2.5 py-0.5">
                  <Award className="h-3.5 w-3.5 text-rose-400" /> VIP MEMBER
                </span>
              )}
            </div>

            {profile.bio ? (
              <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl italic">"{profile.bio}"</p>
            ) : (
              <p className="text-zinc-500 text-sm italic">Henüz bir biyografi yazılmamış.</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-violet-500" />
                Kayıt: {formatProfileDate(profile.createdAt)}
              </span>
              {isOwnProfile && (
                <span className="flex items-center gap-1 rounded border border-violet-500/30 bg-violet-950/20 px-1.5 py-0.5 text-[10px] uppercase font-bold text-fuchsia-400">
                  <Sparkles className="h-3 w-3 text-fuchsia-400" /> VIP HESAP
                </span>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 px-5 py-2.5 text-xs font-bold text-violet-400 hover:bg-violet-600 hover:text-white transition-colors self-end md:self-start mt-4 md:mt-2"
            >
              <Edit3 className="h-4 w-4" /> Profili Düzenle
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {isOwnProfile && (
          <div className="flex border-b border-zinc-800/80 gap-6 overflow-x-auto pb-0.5">
            {(
              [
                { id: "overview" as const, label: "Genel Bakış", icon: User },
                { id: "accounts" as const, label: "Bağlı Hesaplar", icon: Link2 },
                { id: "privacy" as const, label: "Gizlilik Ayarları", icon: Settings },
                { id: "activity" as const, label: "Hesap Geçmişi", icon: Terminal },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-4 text-sm font-bold tracking-wider uppercase transition-colors relative shrink-0 ${
                  activeTab === id ? "text-violet-400" : "text-zinc-400 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {label}
                </span>
                {activeTab === id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-violet-500/15 bg-zinc-950/60 p-6 md:p-8">
          {renderTabContent()}
        </div>
      </div>

      {editModal}

      <div
        ref={playerContainerRef}
        className="absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0"
        aria-hidden
      />

      {musicVideoId && !editModalOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl border border-violet-500/35 bg-zinc-950 px-4 py-2.5 shadow-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/30">
            <Music className={`h-4 w-4 text-violet-400 ${isPlaying ? "opacity-100" : "opacity-60"}`} />
          </div>
          <div className="flex flex-col select-none">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">OST PLAYER</span>
            <span className="text-[11px] font-bold text-zinc-200">
              {soundtrackLoading
                ? "Yükleniyor..."
                : isPlaying
                  ? "Çalıyor"
                  : playerReady
                    ? "Duraklatıldı"
                    : "Oynat"}
            </span>
          </div>
          <button
            onClick={() => void togglePlayback()}
            disabled={soundtrackLoading}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-white disabled:opacity-40"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white ml-0.5" />
            )}
          </button>
        </div>
      )}

      <ProfileDevNote />
    </div>
  );
};
