import React, { useState, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { UserProfileResponse } from "../types/user";
import { BIO_MAX_LENGTH } from "../types/user";
import { X, Camera, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { DEFAULT_PROFILE_COVER, getImageUrl, isImageValid, PROFILE_IMAGE_ACCEPT, PROFILE_IMAGE_MAX_MB } from "../utils/profileImage";

interface EditProfileModalProps {
  profile: UserProfileResponse;
  onClose: () => void;
  onSaveSuccess: (updated: UserProfileResponse) => void;
}

const EditProfileModalComponent: React.FC<EditProfileModalProps> = ({
  profile,
  onClose,
  onSaveSuccess,
}) => {
  const { showToast } = useToast();
  useBodyScrollLock(true);

  const isUploadedUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith("/api/") || url.startsWith("api/") || (!url.startsWith("http") && !url.startsWith("data:image"));
  };

  // Form states
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [gamerType, setGamerType] = useState(profile.gamerType || "CASUAL");
  const [categories, setCategories] = useState<string[]>(
    profile.favoriteCategories
      ? profile.favoriteCategories.split(",").map((s) => s.trim()).filter(Boolean)
      : []
  );

  // Active URLs in modal preview
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl || "");
  const [profileBackgroundUrl, setProfileBackgroundUrl] = useState(profile.profileBackgroundUrl || "");
  const [profileMusicUrl, setProfileMusicUrl] = useState(profile.profileMusicUrl || "");
  const [hardwareCpu, setHardwareCpu] = useState(profile.hardwareCpu || "");
  const [hardwareGpu, setHardwareGpu] = useState(profile.hardwareGpu || "");
  const [hardwareRam, setHardwareRam] = useState(profile.hardwareRam || "");
  const [hardwareOs, setHardwareOs] = useState(profile.hardwareOs || "");

  // Tag Input State
  const [newTag, setNewTag] = useState("");

  // Upload Preview state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"avatar" | "cover" | "background" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs for hidden inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Memoized upload trigger functions
  const openAvatarUpload = useCallback(() => avatarInputRef.current?.click(), []);
  const openCoverUpload = useCallback(() => coverInputRef.current?.click(), []);
  const openBackgroundUpload = useCallback(() => backgroundInputRef.current?.click(), []);

  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = newTag.trim().replace(/,/g, "");
      if (tag && !categories.includes(tag)) {
        setCategories(prev => [...prev, tag]);
      }
      setNewTag("");
    }
  }, [newTag, categories]);

  const handleAddTagBtn = useCallback(() => {
    const tag = newTag.trim().replace(/,/g, "");
    if (tag && !categories.includes(tag)) {
      setCategories(prev => [...prev, tag]);
    }
    setNewTag("");
  }, [newTag, categories]);

  const handleRemoveTag = useCallback((indexToRemove: number) => {
    setCategories(prev => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover" | "background") => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
        showToast("GIF yüklenemez. JPG, PNG veya WebP kullanın.", "error");
        e.target.value = "";
        return;
      }
      if (file.size > PROFILE_IMAGE_MAX_MB * 1024 * 1024) {
        showToast(`Dosya en fazla ${PROFILE_IMAGE_MAX_MB} MB olabilir.`, "error");
        e.target.value = "";
        return;
      }
      setPreviewFile(file);
      setPreviewType(type);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [showToast]);

  const cancelPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewType(null);
  }, [previewUrl]);

  const confirmUpload = useCallback(async () => {
    if (!previewFile || !previewType) return;

    try {
      setUploading(true);
      const res = await userService.uploadFile(previewFile, previewType);
      
      // Update local preview state
      if (previewType === "avatar") {
        setAvatarUrl(res.avatarUrl || "");
      } else if (previewType === "cover") {
        setCoverUrl(res.coverUrl || "");
      } else if (previewType === "background") {
        setProfileBackgroundUrl(res.profileBackgroundUrl || "");
      }

      showToast("Görsel başarıyla yüklendi!", "success");
      cancelPreview();
    } catch {
      showToast("Dosya boyutu çok büyük veya geçersiz format.", "error");
    } finally {
      setUploading(false);
    }
  }, [previewFile, previewType, showToast, cancelPreview]);


  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await userService.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        gamerType,
        favoriteCategories: categories.join(","),
        avatarUrl: avatarUrl.trim(),
        coverUrl: coverUrl.trim(),
        profileThemeUrl: "",
        profileBackgroundUrl: profileBackgroundUrl.trim(),
        profileMusicUrl: profileMusicUrl.trim(),
        hardwareCpu: hardwareCpu.trim(),
        hardwareGpu: hardwareGpu.trim(),
        hardwareRam: hardwareRam.trim(),
        hardwareOs: hardwareOs.trim(),
      });
      showToast("Profil bilgileriniz başarıyla güncellendi.", "success");
      onSaveSuccess(updated);
      onClose();
    } catch {
      showToast("Profil kaydedilirken hata oluştu.", "error");
    } finally {
      setSaving(false);
    }
  }, [displayName, bio, gamerType, categories, avatarUrl, coverUrl, profileBackgroundUrl, profileMusicUrl, hardwareCpu, hardwareGpu, hardwareRam, hardwareOs, showToast, onSaveSuccess, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0 bg-black/90"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl border border-violet-500/35 bg-[#050816] shadow-2xl"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900/80 px-6 py-4">
          <h2 id="edit-profile-title" className="text-base font-black text-violet-300 tracking-widest uppercase">
            Profili Düzenle
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner and Avatar Mock Preview in Modal */}
        <div className="relative h-44 bg-zinc-950">
          {/* Cover image preview */}
          <img
            src={isImageValid(coverUrl) ? getImageUrl(coverUrl) : DEFAULT_PROFILE_COVER}
            alt="Cover Preview"
            className="h-full w-full object-cover brightness-[0.75]"
          />

          {/* Cover hover button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white font-bold transition-all duration-200 cursor-pointer"
          >
            <Camera className="h-6 w-6 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            <span className="text-xs text-zinc-200 font-semibold tracking-wide">Kapak Resmini Değiştir</span>
          </button>
          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept={PROFILE_IMAGE_ACCEPT}
            onChange={(e) => handleFileChange(e, "cover")}
          />

          {/* Avatar Container (Hexagonal layout mirroring profile view, fixed drop-shadow square corner bug) */}
          <div className="absolute -bottom-12 left-6 filter drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] z-20 group">
            <div
              className="h-24 w-24 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 p-[2px]"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <div
                className="h-full w-full bg-zinc-950 overflow-hidden relative"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                {isImageValid(avatarUrl) ? (
                  <img src={getImageUrl(avatarUrl)} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-violet-400 font-black text-xl uppercase font-mono tracking-wider">
                    {(profile.username ?? "LT").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all duration-200 cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept={PROFILE_IMAGE_ACCEPT}
              onChange={(e) => handleFileChange(e, "avatar")}
            />
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="p-6 pt-16 space-y-6">
          {/* Display Name & Gamer Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Görünen İsim</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-violet-500/25 bg-slate-950/70 px-4 py-2.5 text-sm text-zinc-100 focus:border-violet-500/50 focus:bg-slate-950/90 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Oyuncu Tipi</label>
              <select
                value={gamerType}
                onChange={(e) => setGamerType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-violet-500/25 bg-slate-950/70 px-4 py-2.5 text-sm text-zinc-100 focus:border-violet-500/50 focus:bg-slate-950/90 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all duration-200"
              >
                <option value="CASUAL">Casual Gamer</option>
                <option value="COMPETITIVE">Competitive Gamer</option>
                <option value="PRO">Pro E-Sports Player</option>
                <option value="SPEEDRUNNER">Speedrunner</option>
                <option value="ACHIEVEMENT_HUNTER">Achievement Hunter</option>
                <option value="STORY_LOVER">Story Lover</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Biyografi
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
              maxLength={BIO_MAX_LENGTH}
              rows={4}
              placeholder="Kendinden bahset..."
              className="mt-2 w-full resize-none rounded-xl border border-violet-500/25 bg-slate-950/70 px-4 py-2.5 text-sm text-zinc-100 transition-all duration-200 focus:border-violet-500/50 focus:bg-slate-950/90 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            />
            <p className="mt-1 text-right text-[10px] text-zinc-500">
              {bio.length}/{BIO_MAX_LENGTH}
            </p>
          </div>

          {/* Favorite Categories Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Favori Oyun Kategorileri (Enter veya virgül ile ekle)
            </label>
            <div className="mt-2 flex flex-wrap gap-2 p-2.5 rounded-xl border border-violet-500/20 bg-slate-950/50">
              {categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 bg-violet-500/10 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 min-w-[150px] flex-1">
                <input
                  type="text"
                  placeholder="Kategori ekle..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none w-full"
                />
                {newTag.trim() && (
                  <button
                    type="button"
                    onClick={handleAddTagBtn}
                    className="text-violet-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile images — URL or upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Profil Görselleri (URL veya Yükle)
            </label>
            <div className="mt-2 space-y-3 p-4 rounded-xl border border-violet-500/20 bg-slate-950/50">
              {/* Avatar Row */}
              <div className="flex gap-2">
                <span className="w-16 shrink-0 pt-2 text-[10px] font-bold text-zinc-500 uppercase">Avatar</span>
                {isUploadedUrl(avatarUrl) ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Bilgisayardan Yüklendi"
                    className="flex-1 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-400 focus:outline-none select-none font-semibold cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="https://... görsel linki"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-1.5 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                  />
                )}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={openAvatarUpload}
                  className="flex items-center gap-1 rounded-lg bg-violet-500/10 border border-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" /> Yükle
                </button>
              </div>

              {/* Kapak Row */}
              <div className="flex gap-2">
                <span className="w-16 shrink-0 pt-2 text-[10px] font-bold text-zinc-500 uppercase">Kapak</span>
                {isUploadedUrl(coverUrl) ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Bilgisayardan Yüklendi"
                    className="flex-1 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-400 focus:outline-none select-none font-semibold cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="https://... görsel linki"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-1.5 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                  />
                )}
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCoverUpload}
                  className="flex items-center gap-1 rounded-lg bg-violet-500/10 border border-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" /> Yükle
                </button>
              </div>

              {/* Arka Plan Row */}
              <div className="flex gap-2">
                <span className="w-16 shrink-0 pt-2 text-[10px] font-bold text-zinc-500 uppercase">Arka Plan</span>
                {isUploadedUrl(profileBackgroundUrl) ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Bilgisayardan Yüklendi"
                    className="flex-1 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-400 focus:outline-none select-none font-semibold cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="https://... görsel linki"
                    value={profileBackgroundUrl}
                    onChange={(e) => setProfileBackgroundUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-1.5 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                  />
                )}
                {profileBackgroundUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileBackgroundUrl("")}
                    className="flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={openBackgroundUpload}
                  className="flex items-center gap-1 rounded-lg bg-violet-500/10 border border-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" /> Yükle
                </button>
              </div>
              <input
                type="file"
                ref={backgroundInputRef}
                className="hidden"
                accept={PROFILE_IMAGE_ACCEPT}
                onChange={(e) => handleFileChange(e, "background")}
              />
              <p className="text-[10px] text-zinc-500">
                Harici link (Imgur, Discord CDN vb.) sunucuya dosya yüklemeden gösterilir. Yükleme: JPG, PNG, WebP — max {PROFILE_IMAGE_MAX_MB} MB.
              </p>
            </div>
          </div>

          {/* System Hardware Specs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Sistem Donanımı
            </label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-violet-500/20 bg-slate-950/50">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">İşlemci (CPU)</label>
                <input
                  type="text"
                  placeholder="Örn: AMD Ryzen 7 7800X3D"
                  value={hardwareCpu}
                  onChange={(e) => setHardwareCpu(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-2 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ekran Kartı (GPU)</label>
                <input
                  type="text"
                  placeholder="Örn: NVIDIA RTX 4070"
                  value={hardwareGpu}
                  onChange={(e) => setHardwareGpu(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-2 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bellek (RAM)</label>
                <input
                  type="text"
                  placeholder="Örn: 32 GB DDR5"
                  value={hardwareRam}
                  onChange={(e) => setHardwareRam(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-2 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">İşletim Sistemi</label>
                <input
                  type="text"
                  placeholder="Örn: Windows 11"
                  value={hardwareOs}
                  onChange={(e) => setHardwareOs(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-2 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              Donanım bilgileriniz yalnızca kendi profilinizde görünür. Gizlilik ayarlarından görünürlüğünü yönetebilirsiniz.
            </p>
          </div>

          {/* YouTube BGM Player URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              YouTube Soundtrack (Müzik Bağlantısı veya Video ID)
            </label>
            <div className="mt-2 space-y-2 p-4 rounded-xl border border-violet-500/20 bg-slate-950/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... veya Video ID..."
                  value={profileMusicUrl}
                  onChange={(e) => setProfileMusicUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-violet-500/25 bg-slate-950/70 px-3 py-1.5 text-xs text-zinc-100 focus:border-violet-500/50 focus:outline-none"
                />
                {profileMusicUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileMusicUrl("")}
                    className="flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">
                Profiliniz ziyaret edildiğinde çalacak siberpunk mini kaset oynatıcı için bir YouTube şarkı linki girin.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900/80">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-800 bg-white/[0.02] px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all duration-200 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {previewUrl && (
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/95"
              onClick={cancelPreview}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/35 bg-[#050816] p-6 shadow-2xl z-40"
            >
              <div className="flex items-center gap-2 text-fuchsia-400">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-base font-bold text-white tracking-wide">Yüklemeyi Onayla</h3>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">
                Seçilen görselin önizlemesi aşağıdadır. Sunucuya kaydetmek için onaylayın.
              </p>

              {/* Preview Area (fixed drop-shadow square corner bug) */}
              <div className="mt-5 overflow-hidden rounded-xl border border-violet-500/10 bg-slate-950/60 flex items-center justify-center min-h-[180px] max-h-[240px] p-4">
                {previewType === "avatar" ? (
                  <div className="filter drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]">
                    <div
                      className="h-32 w-32 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 p-[3px]"
                      style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      }}
                    >
                      <div
                        className="h-full w-full bg-zinc-950 overflow-hidden"
                        style={{
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="File Preview"
                    className="max-w-full max-h-[220px] object-contain rounded-lg border border-violet-500/20"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-5 mt-3">
                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={uploading}
                  className="rounded-xl border border-zinc-800 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  İptal Et
                </button>
                <button
                  type="button"
                  onClick={confirmUpload}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all duration-200 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>Onayla ve Yükle</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>,
    document.body
  );
};

export const EditProfileModal = memo(EditProfileModalComponent);
