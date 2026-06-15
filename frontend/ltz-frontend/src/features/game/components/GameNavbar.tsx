import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../lib/constants";
import { getRefreshToken } from "../../../lib/token";
import { clearAuth, useAuthStore } from "../../../store/authStore";
import {
  getUserDisplayName,
  getUserInitials,
  getUserRoleLabel,
} from "../../../utils/authUserDisplay";
import ltzLogo from "../../../assets/ltz-yazi.png";
import { authService } from "../../auth/services/authService";

type GameNavbarActiveItem =
  | "Categories"
  | "Developers"
  | "Games"
  | "Platforms"
  | "Publishers"
  | "SystemRequirements";

type GameNavbarProps = {
  activeItem: GameNavbarActiveItem;
};

const navItems = [
  { key: "Games", label: "Oyunlar", href: "/games", icon: "G" },
  { key: "Categories", label: "Kategoriler", href: "/games/categories", icon: "K" },
  { key: "Platforms", label: "Platformlar", href: "/games/platforms", icon: "P" },
  { key: "Developers", label: "Geliştiriciler", href: "/games/developers", icon: "D" },
  { key: "Publishers", label: "Yayıncılar", href: "/games/publishers", icon: "Y" },
  {
    key: "SystemRequirements",
    label: "Sistem Gereksinimleri",
    href: "/games/system-requirements",
    icon: "S",
  },
] as const;

const GameNavbar = ({ activeItem }: GameNavbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRoleLabel(user);
  const initials = getUserInitials(user);

  const handleLogout = async () => {
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
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050b18]/90 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center gap-5 px-4 sm:px-6 lg:px-8">
        <a
          aria-label="LTZ oyunlar"
          className="flex shrink-0 items-center overflow-hidden"
          href="/games"
        >
          <img
            alt="LTZ Logosu"
            className="h-9 w-auto object-contain sm:h-10 md:h-12"
            src={ltzLogo}
          />
        </a>

        <nav className="hidden h-full min-w-0 flex-1 items-center gap-5 md:flex">
          {navItems.map((item) => {
            const active = item.key === activeItem;

            return (
              <a
                className={`relative flex h-full items-center gap-2 px-1 text-sm font-semibold transition ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
                href={item.href}
                key={item.key}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-black ${
                    active
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                      : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {active ? (
                  <span className="absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-700 text-sm font-bold text-slate-950">
              {initials}
            </div>
            <div className="min-w-0 text-right">
              <div className="max-w-40 truncate text-sm font-semibold text-white">
                {displayName}
              </div>
              {roleLabel ? (
                <div className="max-w-40 truncate text-xs text-slate-400">
                  {roleLabel}
                </div>
              ) : null}
            </div>
          </div>

          <Button
            className="h-10 px-3 text-xs"
            disabled={isLoggingOut}
            isLoading={isLoggingOut}
            leftIcon={<LogOut size={15} />}
            onClick={() => void handleLogout()}
            type="button"
            variant="ghost"
          >
            Çıkış Yap
          </Button>
        </div>
      </div>
    </header>
  );
};

export default GameNavbar;
