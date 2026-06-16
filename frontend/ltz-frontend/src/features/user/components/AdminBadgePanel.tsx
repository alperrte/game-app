import { useEffect, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";

import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { AssignedBadgeResponse, BadgeCatalogItem } from "../types/user";

export function AdminBadgePanel() {
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState<BadgeCatalogItem[]>([]);
  const [targetUsername, setTargetUsername] = useState("");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<AssignedBadgeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    void userService.getAdminBadgeCatalog().then(setCatalog).catch(() => {
      showToast("Rozet kataloğu yüklenemedi.", "error");
    });
  }, [showToast]);

  const resolveUser = async () => {
    const username = targetUsername.trim();
    if (!username) return;
    setLoading(true);
    try {
      const profile = await userService.getProfileByUsername(username);
      setTargetUserId(profile.userId);
      const badges = await userService.getAdminUserBadges(profile.userId);
      setAssigned(badges);
    } catch {
      setTargetUserId(null);
      setAssigned([]);
      showToast("Kullanıcı bulunamadı.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBadge = async (item: BadgeCatalogItem) => {
    if (!targetUserId) return;
    const existing = assigned.find((badge) => badge.badgeKey === item.badgeKey);
    setBusyKey(item.badgeKey);
    try {
      if (existing) {
        await userService.removeAdminBadge(targetUserId, item.badgeKey);
        setAssigned((current) => current.filter((badge) => badge.badgeKey !== item.badgeKey));
        showToast("Rozet kaldırıldı.", "success");
      } else {
        const created = await userService.assignAdminBadge(targetUserId, {
          badgeKey: item.badgeKey,
          label: item.label,
        });
        setAssigned((current) => [...current, created]);
        showToast("Rozet atandı.", "success");
      }
    } catch {
      showToast("Rozet işlemi başarısız.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="profile-display-font text-lg font-black text-white">Rozet Yönetimi</h2>
        <p className="text-sm text-zinc-500">Kullanıcılara manuel rozet atayın veya kaldırın.</p>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            onChange={(event) => setTargetUsername(event.target.value)}
            placeholder="Kullanıcı adı..."
            value={targetUsername}
          />
        </div>
        <button
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
          disabled={loading || !targetUsername.trim()}
          onClick={() => void resolveUser()}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bul"}
        </button>
      </div>

      {targetUserId ? (
        <div className="space-y-2">
          {catalog.map((item) => {
            const isAssigned = assigned.some((badge) => badge.badgeKey === item.badgeKey);
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                key={item.badgeKey}
              >
                <div>
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.badgeKey}</p>
                </div>
                <button
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isAssigned
                      ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  }`}
                  disabled={busyKey === item.badgeKey}
                  onClick={() => void toggleBadge(item)}
                  type="button"
                >
                  {busyKey === item.badgeKey ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isAssigned ? (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Kaldır
                    </>
                  ) : (
                    "Ata"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Rozet atamak için önce bir kullanıcı bulun.</p>
      )}
    </div>
  );
}
