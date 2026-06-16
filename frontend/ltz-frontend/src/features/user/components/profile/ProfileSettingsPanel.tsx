import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link2, Settings, Shield, Terminal, X } from "lucide-react";

import { ConnectedAccountsTab } from "../ConnectedAccountsTab";
import { PrivacySettingsTab } from "../PrivacySettingsTab";
import { ActivityLogTab } from "../ActivityLogTab";
import { AdminBadgePanel } from "../AdminBadgePanel";
import { cn } from "../../../../utils/cn";

export type SettingsPanelTab = "privacy" | "accounts" | "activity" | "admin-badges";

const TABS: { id: SettingsPanelTab; label: string; icon: typeof Settings; adminOnly?: boolean }[] = [
  { id: "privacy", label: "Gizlilik", icon: Settings },
  { id: "accounts", label: "Bağlı Hesaplar", icon: Link2 },
  { id: "activity", label: "Aktivite", icon: Terminal },
  { id: "admin-badges", label: "Rozetler", icon: Shield, adminOnly: true },
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

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return createPortal(
    <div className="fixed inset-0 z-[55]">
      <button
        aria-label="Ayarları kapat"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-violet-500/25 bg-zinc-950 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="profile-display-font text-lg font-black text-white">Profil Ayarları</h2>
            <p className="text-sm text-zinc-500">Gizlilik, hesaplar ve aktivite</p>
          </div>
          <button
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="flex w-36 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-950/80 p-2">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition",
                  activeTab === id
                    ? "bg-violet-600/20 text-violet-100 ring-1 ring-violet-500/40"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
                key={id}
                onClick={() => onTabChange(id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-tight">{label}</span>
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-5">
            {activeTab === "privacy" ? <PrivacySettingsTab /> : null}
            {activeTab === "accounts" ? <ConnectedAccountsTab /> : null}
            {activeTab === "activity" ? <ActivityLogTab /> : null}
            {activeTab === "admin-badges" && isAdmin ? <AdminBadgePanel /> : null}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
