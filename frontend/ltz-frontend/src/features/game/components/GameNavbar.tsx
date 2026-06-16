import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/constants";
import { getRefreshToken } from "../../../lib/token";
import { authService } from "../../auth/services/authService";
import { clearAuth, useAuthStore } from "../../../store/authStore";
import { useCurrentUserProfile } from "../../user/context/CurrentUserProfileContext";
import { getImageUrl, isImageValid } from "../../user/utils/profileImage";
import ltzLogo from "../../../assets/ltz-yazi.png";

type GameNavbarActiveItem =
  | "Feed"
  | "Categories"
  | "Developers"
  | "Games"
  | "Platforms"
  | "Publishers"
  | "SystemRequirements"
  | "Profile";

type GameNavbarProps = {
  activeItem: GameNavbarActiveItem;
};

const navItems = [
  { key: "Feed", label: "Akış", href: "/", icon: "⌂" },
  { key: "Games", label: "Oyunlar", href: "/games", icon: "♘" },
  { key: "Categories", label: "Kategoriler", href: "/games/categories", icon: "⬡" },
  { key: "Platforms", label: "Platformlar", href: "/games/platforms", icon: "▭" },
  { key: "Developers", label: "Geliştiriciler", href: "/games/developers", icon: "♙" },
  { key: "Publishers", label: "Yayıncılar", href: "/games/publishers", icon: "▥" },
  {
    key: "SystemRequirements",
    label: "Sistem Gereksinimleri",
    href: "/games/system-requirements",
    icon: "⚙",
  },
] as const;

const roleLabels: Record<string, string> = {
  USER: "Oyuncu",
  ADMIN: "Yönetici",
  MODERATOR: "Moderatör",
};

const GameNavbar = ({ activeItem }: GameNavbarProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuthStore();
  const { displayName, avatarUrl } = useCurrentUserProfile();

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
      <div className="mx-auto flex h-20 max-w-[1840px] items-center gap-8 px-8">
        <a className="mr-8 block shrink-0" href="/games" aria-label="LobbyTwoZero games">
          <img src={ltzLogo} alt="LobbyTwoZero" className="h-10 max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]" />
        </a>

        <nav className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] 2xl:gap-4 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = item.key === activeItem;

            return (
              <NavLink
                className={`relative flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-1 text-[11px] font-semibold transition hover:-translate-y-0.5 2xl:gap-2 2xl:text-[13px] ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
                to={item.href}
                end={item.key === "Feed"}
                key={item.key}
              >
                <span
                  className={`text-xl 2xl:text-2xl ${
                    active ? "text-violet-400" : "text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {active ? (
                  <span className="absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <label className="relative hidden w-[240px] shrink-0 2xl:block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
            ⌕
          </span>
          <input
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/70"
            placeholder="Oyun, geliştirici, yayıncı ara..."
          />
        </label>

        <button
          aria-label="Bildirimler"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl text-slate-300 hover:bg-white/5"
          type="button"
        >
          ♧
        </button>

        <button
          className="hidden h-11 shrink-0 items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 xl:inline-flex 2xl:px-4"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <span className="text-lg">↪</span>
          {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>

        {user ? (
          <button
            type="button"
            onClick={() => navigate(`/profile/${user.username}`)}
            className={`hidden items-center gap-3 lg:flex cursor-pointer transition duration-150 select-none group px-3 py-1.5 rounded-xl border ${
              activeItem === "Profile"
                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                : "border-transparent hover:bg-white/5"
            }`}
          >
            <div
              className={`h-11 w-11 overflow-hidden rounded-full border transition-all ${
                activeItem === "Profile"
                  ? "border-violet-400 shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105"
                  : "border-violet-500/30 group-hover:border-violet-400/60"
              }`}
            >
              {isImageValid(avatarUrl) ? (
                <img
                  src={getImageUrl(avatarUrl)}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-bold text-white">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-left">
              <div
                className={`text-sm font-semibold transition-colors ${
                  activeItem === "Profile" ? "text-violet-300 font-bold" : "text-white group-hover:text-violet-300"
                }`}
              >
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                {roleLabels[user.role?.toUpperCase() ?? "USER"] ?? user.role}
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-white transition-colors">⌄</span>
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default GameNavbar;
