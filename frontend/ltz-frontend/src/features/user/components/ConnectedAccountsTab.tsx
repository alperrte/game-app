import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { ConnectedAccountResponse } from "../types/user";
import {
  CONNECTED_ACCOUNTS_OAUTH_ENABLED,
  startPlatformOAuth,
  type ConnectablePlatform,
} from "../connectedAccountsIntegration";
import { Trash2, Link2, Gamepad2, Clock, Wrench } from "lucide-react";

const PLATFORMS = [
  {
    key: "steam" as const,
    label: "Steam",
    subtitle: "VALVE PLATFORM",
    connectLabel: "STEAM",
    description:
      "Steam kütüphanenizi ve oyun sürelerinizi LTZ profilinizde sergilemek için hesabınızı bağlayın.",
    activeBorder: "border-sky-500/40 bg-sky-950/10 shadow-[0_0_30px_rgba(14,165,233,0.15)]",
    hoverBorder: "hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]",
    iconBg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    btnClass:
      "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:shadow-[0_0_25px_rgba(14,165,233,0.35)]",
    accountBg: "bg-sky-950/20 border-sky-500/20",
    accountText: "text-sky-200",
    glow: "bg-sky-500/5",
    icon: <Gamepad2 className="h-7 w-7" />,
  },
  {
    key: "discord" as const,
    label: "Discord",
    subtitle: "COMMUNITY CHAT",
    connectLabel: "DISCORD",
    description:
      "Discord durum eşitlemesini ve zengin varlık (Rich Presence) özelliklerini aktif etmek için bağlayın.",
    activeBorder: "border-violet-500/40 bg-violet-950/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    hoverBorder: "hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
    iconBg: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    btnClass:
      "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500 hover:text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]",
    accountBg: "bg-violet-950/20 border-violet-500/20",
    accountText: "text-violet-200",
    glow: "bg-violet-500/5",
    icon: (
      <svg className="h-6 w-6 fill-current" viewBox="0 0 127.14 96.36">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C-1.89,39.29-4.22,69.74,3.34,95.3a106.3,106.3,0,0,0,32.22,1.06,78.89,78.89,0,0,0,6.76-11A68.6,68.6,0,0,1,31.57,79.5c1-.72,2-1.47,3-2.25a74.09,74.09,0,0,0,65,0c1,.78,2,1.53,3,2.25a68.86,68.86,0,0,1-10.74,5.88,79.08,79.08,0,0,0,6.76,11,106.3,106.3,0,0,0,32.22-1.06C131.74,62.83,128.53,32.55,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.88,46,53.88,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.12,46,96.12,53,91,65.69,84.69,65.69Z" />
      </svg>
    ),
  },
] as const;

const ComingSoonPlaceholder: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-white tracking-wide">Üçüncü Parti Hesap Bağlantıları</h2>
      <p className="text-sm text-zinc-400">
        Steam ve Discord OAuth entegrasyonu game-service tarafında geliştiriliyor.
      </p>
    </div>

    <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-zinc-950/50 p-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/30">
          <Clock className="h-8 w-8 text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">Yakında Aktif</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md leading-relaxed">
            Steam kütüphane senkronizasyonu ve Discord bağlantısı OAuth ile gelecek.
            Endpoint&apos;ler hazır olduğunda{" "}
            <code className="text-violet-300 text-xs">connectedAccountsIntegration.ts</code> dosyasındaki
            flag açılarak bu sekme otomatik güncellenecek.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-500">
          <Wrench className="h-3.5 w-3.5 text-zinc-600" />
          <span>
            Aktifleştirmek için:{" "}
            <code className="text-zinc-400">CONNECTED_ACCOUNTS_OAUTH_ENABLED = true</code>
          </span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none select-none">
      {PLATFORMS.map((p) => (
        <div
          key={p.key}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6"
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl border ${p.iconBg}`}>
              {p.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{p.label}</h3>
              <p className="text-[10px] text-zinc-500 font-black tracking-widest">{p.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OAuthAccountsPanel: React.FC = () => {
  const [accounts, setAccounts] = useState<ConnectedAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    userService
      .getConnectedAccounts()
      .then((data) => {
        if (active) setAccounts(data);
      })
      .catch(() => {
        if (active) showToast("Bağlı hesaplar yüklenirken bir hata oluştu.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const reloadAccounts = async () => {
    setLoading(true);
    try {
      const data = await userService.getConnectedAccounts();
      setAccounts(data);
    } catch {
      showToast("Bağlı hesaplar yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getAccountByPlatform = (platform: string) =>
    accounts.find((acc) => acc.platformName.toUpperCase() === platform);

  const handleConnect = (platform: ConnectablePlatform) => {
    startPlatformOAuth(platform, location.pathname);
  };

  const handleDisconnect = async (id: number, platform: string) => {
    if (!window.confirm(`${platform} bağlantısını kesmek istediğinizden emin misiniz?`)) return;

    try {
      await userService.disconnectAccount(id);
      showToast(`${platform} bağlantısı başarıyla kesildi.`, "success");
      await reloadAccounts();
    } catch {
      showToast("Bağlantı kesilirken bir hata oluştu.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white tracking-wide">Üçüncü Parti Hesap Bağlantıları</h2>
        <p className="text-sm text-zinc-400">
          Hesaplarınızı bağlayarak oyun istatistiklerinizi, başarımlarınızı ve arkadaş listenizi eşleştirebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((p) => {
          const account = getAccountByPlatform(p.connectLabel);
          return (
            <div
              key={p.key}
              className={`relative overflow-hidden rounded-2xl border p-6 ${
                account ? p.activeBorder : `border-zinc-800/80 bg-zinc-950/40 ${p.hoverBorder}`
              }`}
            >
              <div className={`absolute top-0 right-0 h-24 w-24 blur-3xl pointer-events-none rounded-full ${p.glow}`} />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl border ${p.iconBg}`}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{p.label}</h3>
                    <p className={`text-[10px] font-black tracking-widest mt-0.5 ${p.iconBg.includes("sky") ? "text-sky-400" : "text-violet-400"}`}>
                      {p.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider ${
                    account
                      ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                  }`}
                >
                  {account ? "BAĞLI" : "BAĞLI DEĞİL"}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {account ? (
                  <div className={`rounded-xl border p-3 shadow-inner ${p.accountBg}`}>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bağlı Hesap</p>
                    <p className={`text-sm font-semibold mt-0.5 font-mono ${p.accountText}`}>
                      {account.platformUsername}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 leading-relaxed">{p.description}</p>
                )}

                <div className="flex justify-end pt-2">
                  {account ? (
                    <button
                      onClick={() => void handleDisconnect(account.id, p.label)}
                      className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Bağlantıyı Kes
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(p.key)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${p.btnClass}`}
                    >
                      <Link2 className="h-4 w-4" /> {p.label} Bağla
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ConnectedAccountsTab: React.FC = () => {
  if (!CONNECTED_ACCOUNTS_OAUTH_ENABLED) {
    return <ComingSoonPlaceholder />;
  }
  return <OAuthAccountsPanel />;
};
