import React, { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { PrivacySettingsResponse, VisibilityLevel } from "../types/user";
import { Clock, Eye, Shield, Cpu, Users, UserPlus } from "lucide-react";

const SECTIONS = [
  {
    key: "profileVisibility" as const,
    title: "Profil Görünürlüğü",
    description:
      "Profil sayfanızın, bio bilginizin ve genel istatistiklerinizin kimler tarafından görüntülenebileceğini belirler.",
    icon: Eye,
    iconClass: "text-violet-400",
  },
  {
    key: "gameLibraryVisibility" as const,
    title: "Oyun Kütüphanesi",
    description:
      "Sahip olduğunuz oyunları, oynama sürelerinizi ve oyunlardaki başarımlarınızı kimlerin görebileceğini ayarlar.",
    icon: Shield,
    iconClass: "text-fuchsia-400",
  },
  {
    key: "hardwareVisibility" as const,
    title: "Donanım Bilgileri",
    description:
      "Bilgisayar donanımı (ekran kartı, işlemci, RAM vb.) ve sistem özelliklerinizin profilinizde listelenme izinleri.",
    icon: Cpu,
    iconClass: "text-sky-400",
  },
  {
    key: "friendListVisibility" as const,
    title: "Arkadaş Listesi",
    description:
      "Profilinizde ekli olan arkadaşlarınızın listenin diğer kullanıcılar tarafından görülebilirliğini ayarlar.",
    icon: Users,
    iconClass: "text-emerald-400",
  },
  {
    key: "followerListVisibility" as const,
    title: "Takipçi Listesi",
    description:
      "Takipçi listenizin profilinizde başkaları tarafından görüntülenip görüntülenmeyeceğini belirler.",
    icon: UserPlus,
    iconClass: "text-cyan-400",
  },
  {
    key: "lastSeenVisibility" as const,
    title: "Son Görülme",
    description:
      "Profilinizde son görülme zamanınızın diğer kullanıcılara gösterilip gösterilmeyeceğini ayarlar.",
    icon: Clock,
    iconClass: "text-amber-400",
  },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC" as const, label: "HERKESE AÇIK" },
  { value: "FRIENDS_ONLY" as const, label: "SADECE ARKADAŞLAR" },
  { value: "PRIVATE" as const, label: "GİZLİ" },
] as const;

export const PrivacySettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    userService
      .getPrivacySettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        if (active) showToast("Gizlilik ayarları yüklenirken bir hata oluştu.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleUpdate = async (
    field: keyof Omit<PrivacySettingsResponse, "userId">,
    value: VisibilityLevel,
  ) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [field]: value };

    try {
      const result = await userService.updatePrivacySettings({
        profileVisibility: updatedSettings.profileVisibility,
        gameLibraryVisibility: updatedSettings.gameLibraryVisibility,
        hardwareVisibility: updatedSettings.hardwareVisibility,
        friendListVisibility: updatedSettings.friendListVisibility,
        followerListVisibility: updatedSettings.followerListVisibility,
        lastSeenVisibility: updatedSettings.lastSeenVisibility,
      });
      setSettings(result);
      showToast("Gizlilik ayarları başarıyla güncellendi.", "success");
    } catch {
      showToast("Ayarlar kaydedilirken bir hata oluştu.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-wide text-white">Gizlilik Tercihleri</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Uygulama genelinde profilinizin ve verilerinizin görünürlük düzeyini kendinize göre özelleştirin.
        </p>
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
          &quot;Sadece arkadaşlar&quot; seçeneği şu an güvenli modda çalışır: arkadaş olmayan kullanıcılar
          bu bilgileri göremez. Tam arkadaş kontrolü yakında eklenecek.
        </p>
      </div>

      <div className="space-y-3">
        {settings &&
          SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                className="flex flex-col gap-4 rounded-xl border border-violet-500/10 bg-slate-950/45 p-4"
                key={section.key}
              >
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-slate-900/60">
                    <Icon className={`h-4 w-4 ${section.iconClass}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-wide text-white">{section.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{section.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl border border-violet-500/10 bg-slate-950/60 mt-3">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const isActive = settings[section.key] === opt.value;
                    return (
                      <button
                        className={`cursor-pointer rounded-lg px-2 py-2.5 text-center text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-violet-600/35 to-fuchsia-600/35 text-violet-200 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                            : "text-zinc-500 hover:text-zinc-300 bg-transparent border border-transparent"
                        }`}
                        key={opt.value}
                        onClick={() => void handleUpdate(section.key, opt.value)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
