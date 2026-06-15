import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "../components/ui/Button";
import { ROUTES } from "../lib/constants";
import { getRefreshToken } from "../lib/token";
import { clearAuth, useAuthStore } from "../store/authStore";
import { authService } from "../features/auth/services/authService";
import ltzLogo from "../assets/ltz-yazi.png";
import {
  getUserDisplayName,
  getUserInitials,
  getUserRoleLabel,
} from "../utils/authUserDisplay";

export function MainLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRoleLabel(user);
  const initials = getUserInitials(user);

  async function handleLogout() {
    setIsLoggingOut(true);

    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch {
      /* Logout hatasi kullaniciyi engellememeli. */
    } finally {
      clearAuth();
      navigate(ROUTES.login, { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-ltz-bg text-white">
      <header className="border-b border-white/10 bg-ltz-panel/60 backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
          <a
            aria-label="Ana sayfa"
            className="flex shrink-0 items-center overflow-hidden"
            href={ROUTES.home}
          >
            <img
              alt="LTZ Logosu"
              className="h-9 w-auto object-contain sm:h-10"
              src={ltzLogo}
            />
          </a>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-600 text-xs font-bold text-slate-950">
                {initials}
              </div>
              <div className="min-w-0 text-right">
                <div className="max-w-40 truncate text-sm font-semibold text-white">
                  {displayName}
                </div>
                {roleLabel ? (
                  <div className="max-w-40 truncate text-xs text-zinc-400">
                    {roleLabel}
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 text-xs"
              isLoading={isLoggingOut}
              leftIcon={<LogOut size={15} />}
              onClick={handleLogout}
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-57px)]">
        <Outlet />
      </main>
    </div>
  );
}
