import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/constants";
import { getRefreshToken } from "../../../lib/token";
import { authService } from "../../auth/services/authService";
import { clearAuth, useAuthStore } from "../../../store/authStore";
import { FriendRequestsModal } from "../../social/components/FriendRequestsModal";
import { socialService } from "../../social/services/socialService";
import ltzLogo from "../../../assets/ltz-yazi.png";

type GameNavbarActiveItem =
  | "Feed"
  | "Categories"
  | "Developers"
  | "Games"
  | "Messages"
  | "Platforms"
  | "Publishers"
  | "SystemRequirements"
  | "Profile";

type GameNavbarProps = {
  activeItem: GameNavbarActiveItem;
};

const navItems = [
  { key: "Feed", label: "Akış", href: "/", icon: "⌂" },
  { key: "Messages", label: "Sohbet", href: "/messages", icon: "💬" },
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
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const { user } = useAuthStore();

  const refreshPendingRequestCount = useCallback(async () => {
    if (!user?.userId) {
      setPendingRequestCount(0);
      return;
    }

    try {
      const requests = await socialService.getIncomingFriendRequests(user.userId);
      setPendingRequestCount(requests.length);
    } catch {
      setPendingRequestCount(0);
    }
  }, [user?.userId]);

  useEffect(() => {
    void refreshPendingRequestCount();
  }, [refreshPendingRequestCount]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileMenuOpen]);

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

  function openProfile() {
    if (!user?.username) return;

    setProfileMenuOpen(false);
    navigate(`/profile/${user.username}`);
  }

  function openFriendRequests() {
    setProfileMenuOpen(false);
    setFriendRequestsOpen(true);
  }

  return (
    <>
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

          {user ? (
            <div className="relative hidden lg:block" ref={profileMenuRef}>
              <button
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                className={`flex cursor-pointer items-center gap-3 transition duration-150 select-none group px-3 py-1.5 rounded-xl border ${
                  activeItem === "Profile" || profileMenuOpen
                    ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                    : "border-transparent hover:bg-white/5"
                }`}
                onClick={() => setProfileMenuOpen((open) => !open)}
                type="button"
              >
                <div
                  className={`grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white transition-all ${
                    activeItem === "Profile" || profileMenuOpen
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105"
                      : "bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_0_10px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  }`}
                >
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div
                    className={`text-sm font-semibold transition-colors ${
                      activeItem === "Profile" || profileMenuOpen
                        ? "text-violet-300 font-bold"
                        : "text-white group-hover:text-violet-300"
                    }`}
                  >
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
                <span
                  className={`text-slate-500 transition-transform duration-200 group-hover:text-white ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  ⌄
                </span>
              </button>

              {profileMenuOpen ? (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#0a101c]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  role="menu"
                >
                  <button
                    className="flex w-full cursor-pointer items-center gap-3 border-b border-white/8 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                    onClick={openProfile}
                    role="menuitem"
                    type="button"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                      ◉
                    </span>
                    Profil
                  </button>
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                    onClick={openFriendRequests}
                    role="menuitem"
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                        ✦
                      </span>
                      İstekler
                    </span>
                    {pendingRequestCount > 0 ? (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                        {pendingRequestCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <FriendRequestsModal
        onClose={() => setFriendRequestsOpen(false)}
        onRequestsChanged={() => void refreshPendingRequestCount()}
        open={friendRequestsOpen}
      />
    </>
  );
};

export default GameNavbar;
