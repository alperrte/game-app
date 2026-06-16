import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/constants";
import { getRefreshToken } from "../../../lib/token";
import { authService } from "../../auth/services/authService";
import { clearAuth } from "../../../store/authStore";

type GameNavbarActiveItem =
  | "Feed"
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

const GameNavbar = ({ activeItem }: GameNavbarProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <div className="mx-auto flex h-20 max-w-[1840px] items-center gap-3 px-4 2xl:gap-5 2xl:px-7">
        <NavLink className="mr-1 block shrink-0 2xl:mr-4" to="/" aria-label="LobbyTwoZero akış">
          <div className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-4xl font-black italic leading-none tracking-tight text-transparent 2xl:text-5xl">
            LTZ
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.38em] text-white/70 2xl:text-[10px] 2xl:tracking-[0.45em]">
            Lobby Two Zero
          </div>
        </NavLink>

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
          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            12
          </span>
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

        <div className="hidden shrink-0 items-center gap-3 2xl:flex">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-700 text-sm font-bold text-slate-950">
            AD
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Arda Demir</div>
            <div className="text-xs text-slate-400">Yönetici</div>
          </div>
          <span className="text-slate-500">⌄</span>
        </div>
      </div>
    </header>
  );
};

export default GameNavbar;
