import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link2, Settings, Shield, Terminal, X, AlertOctagon } from "lucide-react";

import { ConnectedAccountsTab } from "../ConnectedAccountsTab";
import { PrivacySettingsTab } from "../PrivacySettingsTab";
import { ActivityLogTab } from "../ActivityLogTab";
import { AdminBadgePanel } from "../AdminBadgePanel";
import { AdminReportsPanel } from "../AdminReportsPanel";
import { cn } from "../../../../utils/cn";

export type SettingsPanelTab = "privacy" | "accounts" | "activity" | "admin-badges" | "admin-reports";

const TABS: { id: SettingsPanelTab; label: string; icon: typeof Settings; adminOnly?: boolean }[] = [
  { id: "privacy", label: "Gizlilik", icon: Settings },
  { id: "accounts", label: "Bağlı Hesaplar", icon: Link2 },
  { id: "activity", label: "Aktivite", icon: Terminal },
  { id: "admin-badges", label: "Rozetler", icon: Shield, adminOnly: true },
  { id: "admin-reports", label: "Şikayetler", icon: AlertOctagon, adminOnly: true },
];

type ProfileSettingsPanelProps = {
  open: boolean;
  activeTab: SettingsPanelTab;
  isAdmin: boolean;
  onClose: () => void;
  onTabChange: (tab: SettingsPanelTab) => void;
};

export function ProfileSettingsPanel({
  open,
  activeTab,
  isAdmin,
  onClose,
  onTabChange,
}: ProfileSettingsPanelProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // TODO: Gelecekte moderatörlerin de bu panelleri (Şikayetler vb.) yönetebilmesi için "isAdmin" yerine "isAdmin || isModerator" kontrolü eklenebilir.
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-violet-500/35 bg-[#050816] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-900/80 px-6 py-4">
          <div>
            <h2 id="settings-panel-title" className="text-base font-black text-violet-300 tracking-widest uppercase">
              Profil Ayarları
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Gizlilik, bağlı hesaplar ve işlem geçmişi</p>
          </div>
          <button
            className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex shrink-0 gap-1.5 border-b border-zinc-900/80 bg-zinc-950/40 p-3 overflow-x-auto scrollbar-none">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer",
                activeTab === id
                  ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-300 ring-1 ring-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
              key={id}
              onClick={() => onTabChange(id)}
              type="button"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {activeTab === "privacy" ? <PrivacySettingsTab /> : null}
          {activeTab === "accounts" ? <ConnectedAccountsTab /> : null}
          {activeTab === "activity" ? <ActivityLogTab /> : null}
          {activeTab === "admin-badges" && isAdmin ? <AdminBadgePanel /> : null}
          {activeTab === "admin-reports" && isAdmin ? <AdminReportsPanel /> : null}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-900/80 px-6 py-4 bg-zinc-950/20">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Tüm değişiklikler otomatik olarak kaydedilir
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-white/[0.02] px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
