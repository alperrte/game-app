import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/constants";
import { getRefreshToken } from "../../../lib/token";
import { authService } from "../../auth/services/authService";
import { clearAuth, useAuthStore } from "../../../store/authStore";
import ltzLogo from "../../../assets/ltz-yazi.png";

type GameNavbarActiveItem =
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

const GameNavbar = ({ activeItem }: GameNavbarProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuthStore();

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

        <nav className="flex h-full min-w-0 flex-1 items-center gap-6">
          {navItems.map((item) => {
            const active = item.key === activeItem;

            return (
              <a
                className={`relative flex h-full items-center gap-3 px-1 text-sm font-semibold transition ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
                href={item.href}
                key={item.key}
              >
                <span
                  className={`text-2xl ${
                    active ? "text-violet-400" : "text-slate-500"
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

        <label className="relative hidden w-[380px] xl:block">
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
          className="relative grid h-11 w-11 place-items-center rounded-xl text-2xl text-slate-300 hover:bg-white/5"
          type="button"
        >
          ♧
          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            12
          </span>
        </button>

        <button
          className="hidden h-11 items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <span className="text-lg">↪</span>
          {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>

        {/* Dynamic User Profile Navigation */}
        {user ? (
          <div
            onClick={() => navigate(`/profile/${user.username}`)}
            className={`hidden items-center gap-3 lg:flex cursor-pointer transition duration-150 select-none group px-3 py-1.5 rounded-xl border ${
              activeItem === "Profile"
                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                : "border-transparent hover:bg-white/5"
            }`}
          >
            <div className={`grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white transition-all ${
              activeItem === "Profile"
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105"
                : "bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_0_10px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            }`}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className={`text-sm font-semibold transition-colors ${
                activeItem === "Profile" ? "text-violet-300 font-bold" : "text-white group-hover:text-violet-300"
              }`}>
                {user.username}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                {user.role}
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-white transition-colors">⌄</span>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default GameNavbar;
