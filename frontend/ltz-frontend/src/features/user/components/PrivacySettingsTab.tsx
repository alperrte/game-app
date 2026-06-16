import React, { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { PrivacySettingsResponse, VisibilityLevel } from "../types/user";
import { Eye, Shield, Cpu, Users } from "lucide-react";

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
      "Profilinizde ekli olan arkadaşlarınızın listenin diğer kullanıcılar tarafından aranabilirliğini ayarlar.",
    icon: Users,
    iconClass: "text-emerald-400",
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
    value: VisibilityLevel
  ) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [field]: value };

    try {
      const result = await userService.updatePrivacySettings({
        profileVisibility: updatedSettings.profileVisibility,
        gameLibraryVisibility: updatedSettings.gameLibraryVisibility,
        hardwareVisibility: updatedSettings.hardwareVisibility,
        friendListVisibility: updatedSettings.friendListVisibility,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white tracking-wide">Gizlilik Tercihleri</h2>
        <p className="text-sm text-zinc-400">
          Uygulama genelinde profilinizin ve verilerinizin görünürlük düzeyini kendinize göre özelleştirin.
        </p>
      </div>

      <div className="space-y-4">
        {settings &&
          SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.key}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-violet-500/10 bg-slate-950/45 p-5"
              >
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/60 border border-violet-500/20">
                    <Icon className={`h-5 w-5 ${section.iconClass}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">{section.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">{section.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const isActive = settings[section.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => void handleUpdate(section.key, opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors border cursor-pointer ${
                          isActive
                            ? "bg-violet-500/15 border-violet-500 text-violet-200"
                            : "bg-slate-900 border-zinc-800 text-zinc-500 hover:border-violet-500/40 hover:text-zinc-200"
                        }`}
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
