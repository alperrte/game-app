import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Video, X } from "lucide-react";

import type { UserProfileClipResponse } from "../../types/user";
import { userService } from "../../services/userService";
import { SectionPanel } from "./ProfilePrimitives";
import { cn } from "../../../../utils/cn";
import type { ProfileThemeClasses } from "../../utils/theme";

type ProfileClipsSectionProps = {
  theme: ProfileThemeClasses;
  userId: string;
  isOwnProfile: boolean;
};

// Helper: YouTube video ID ve Embed URL üretme
function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0`;
  }
  return null;
}

// Helper: Twitch Video/Clip Embed URL üretme
function getTwitchEmbedUrl(url: string): string | null {
  const parent = window.location.hostname || "localhost";
  
  // clips.twitch.tv/CLIP_SLUG
  if (url.includes("clips.twitch.tv/")) {
    const slug = url.split("clips.twitch.tv/")[1]?.split(/[?#]/)[0];
    if (slug) {
      return `https://clips.twitch.tv/embed?clip=${slug}&parent=${parent}&autoplay=false`;
    }
  }
  
  // twitch.tv/username/clip/CLIP_SLUG
  if (url.includes("/clip/")) {
    const parts = url.split("/clip/");
    const slug = parts[1]?.split(/[?#]/)[0];
    if (slug) {
      return `https://clips.twitch.tv/embed?clip=${slug}&parent=${parent}&autoplay=false`;
    }
  }
  
  // twitch.tv/videos/VIDEO_ID
  if (url.includes("twitch.tv/videos/")) {
    const videoId = url.split("twitch.tv/videos/")[1]?.split(/[?#]/)[0];
    if (videoId) {
      return `https://player.twitch.tv/?video=${videoId}&parent=${parent}&autoplay=false`;
    }
  }
  return null;
}

// Helper: Genel Embed URL bulucu
function getEmbedUrl(url: string, platform: string): string | null {
  if (platform === "YOUTUBE") {
    return getYouTubeEmbedUrl(url);
  }
  if (platform === "TWITCH") {
    return getTwitchEmbedUrl(url);
  }
  return null;
}

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function ProfileClipsSection({ theme, userId, isOwnProfile }: ProfileClipsSectionProps) {
  const [clips, setClips] = useState<UserProfileClipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClips = useCallback(async (active: boolean) => {
    try {
      if (active) setLoading(true);
      const data = await userService.getUserClips(userId);
      if (active) {
        setClips(data);
        setError(null);
      }
    } catch (err) {
      if (active) {
        setError("Klipler yüklenirken bir hata oluştu.");
      }
      console.error(err);
    } finally {
      if (active) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void fetchClips(active);
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchClips]);

  const handleAddClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setFormError("Başlık ve Video URL alanları zorunludur.");
      return;
    }

    // Basit ön yüz kontrolü
    const lowercaseUrl = videoUrl.toLowerCase();
    const isYouTube = lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be");
    const isTwitch = lowercaseUrl.includes("twitch.tv");
    if (!isYouTube && !isTwitch) {
      setFormError("Sadece YouTube ve Twitch video/klip linkleri desteklenmektedir.");
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError(null);
      await userService.addUserClip({ title: title.trim(), videoUrl: videoUrl.trim() });
      setTitle("");
      setVideoUrl("");
      setShowAddForm(false);
      await fetchClips(true);
    } catch (err: unknown) {
      const errorLike = err as AxiosErrorLike;
      const msg = errorLike.response?.data?.message || "Klip eklenirken bir hata oluştu.";
      setFormError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClip = async (clipId: number) => {
    if (!window.confirm("Bu klibi profilinizden kaldırmak istediğinize emin misiniz?")) {
      return;
    }

    try {
      await userService.deleteUserClip(clipId);
      await fetchClips(true);
    } catch (err: unknown) {
      alert("Klip silinirken bir hata oluştu.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <SectionPanel
      description="YouTube ve Twitch üzerinden öne çıkarılan oyun klipleri galerisi."
      id="profile-clips"
      title="Klipler ve Önemli Anlar"
    >
      {/* Hata Durumu */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Üst Kısım: Klip Ekleme Butonu */}
      {isOwnProfile && !showAddForm && (
        <div className="mb-6">
          {clips.length < 5 ? (
            <button
              onClick={() => setShowAddForm(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition duration-200 cursor-pointer",
                theme.border,
                theme.bg,
                theme.text,
                "hover:bg-white/10 hover:text-white"
              )}
            >
              <Plus className="h-4 w-4" /> Yeni Klip Ekle
            </button>
          ) : (
            <p className="text-sm italic text-zinc-500">Maksimum klip sınırına (5/5) ulaştınız.</p>
          )}
        </div>
      )}

      {/* Klip Ekleme Formu */}
      {showAddForm && (
        <form onSubmit={handleAddClip} className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
              <Video className={cn("h-4 w-4", theme.text)} /> Yeni Video / Klip Ekle
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
              className="text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="clip-title" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Klip Başlığı
              </label>
              <input
                id="clip-title"
                type="text"
                placeholder="Örn: 1v5 Clutch Valorant Ace!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="clip-url" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Video / Klip URL (YouTube veya Twitch)
              </label>
              <input
                id="clip-url"
                type="url"
                placeholder="Örn: https://www.youtube.com/watch?v=... veya https://clips.twitch.tv/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                maxLength={255}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-bold text-white transition duration-200 cursor-pointer flex items-center gap-1.5",
                theme.border,
                theme.bg,
                "hover:bg-white/10"
              )}
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Klibi Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Klipler Grid Yapısı */}
      {clips.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {clips.map((clipItem) => {
            const embedUrl = getEmbedUrl(clipItem.videoUrl, clipItem.platform);
            return (
              <div
                key={clipItem.id}
                className="group relative flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3 shadow-md hover:border-zinc-700/80 transition duration-200"
              >
                {/* Embed Oynatıcı */}
                {embedUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-900/50">
                    <iframe
                      src={embedUrl}
                      title={clipItem.title}
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-500">
                    <Video className="mb-2 h-8 w-8 text-zinc-600" />
                    <span>Video yüklenemedi (Geçersiz URL)</span>
                    <a
                      href={clipItem.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs text-violet-400 hover:underline"
                    >
                      Dış bağlantıda aç
                    </a>
                  </div>
                )}

                {/* Klip Bilgileri */}
                <div className="mt-3 flex items-start justify-between gap-2 px-1">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition">
                      {clipItem.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {clipItem.platform}
                    </span>
                  </div>

                  {/* Silme Butonu */}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeleteClip(clipItem.id)}
                      className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
                      title="Klibi Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800/80 p-8 text-center">
          <Video className="mb-3 h-10 w-10 text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-400">Henüz Klip Eklenmemiş</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-xs">
            {isOwnProfile
              ? "YouTube veya Twitch üzerinden en iyi anlarınızı ekleyerek profilinizde sergileyin!"
              : "Bu oyuncu henüz hiçbir klip paylaşmamış."}
          </p>
        </div>
      )}
    </SectionPanel>
  );
}
