/*
 * Uygulamanın genel, sabit (sticky) üst navigasyonu.
 *
 * Tek sıra: logo (ana akışa link + login'deki glow efekti) + bölüm menüsü
 * (lucide ikonları, aktif sekme neon pill) + kullanıcı + çıkış.
 *
 * - Aktif sekme, en uzun eşleşen yola göre otomatik belirlenir.
 * - Game-service sayfaları "Oyunlar" dropdown altında gruplanır.
 * - Sistem Gereksinimleri dropdown içinde değil, Oyunlar'ın sağında ayrı item olarak kalır.
 * - Oyunlar dropdown sadece ok butonuna tıklanınca açılır/kapanır.
 * - Scroll'da kondens olur (incelir, blur/gölge artar).
 * - Alt kenarda login dilini yansıtan neon gradient hairline.
 */

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    Building2,
    ChevronDown,
    Code2,
    Cpu,
    Gamepad2,
    Home,
    LayoutGrid,
    LogOut,
    MonitorSmartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "../ui/Button";
import { ROUTES } from "../../lib/constants";
import { getRefreshToken } from "../../lib/token";
import { clearAuth, useAuthStore } from "../../store/authStore";
import { authService } from "../../features/auth/services/authService";
import ltzLogo from "../../assets/ltz-yazi.png";
import {
    getUserDisplayName,
    getUserInitials,
    getUserRoleLabel,
} from "../../utils/authUserDisplay";

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const mainNavItems: NavItem[] = [
    { label: "Akış", href: "/", icon: Home },
];

const gameServiceItems: NavItem[] = [
    { label: "Oyunlar", href: "/games", icon: Gamepad2 },
    { label: "Kategoriler", href: "/games/categories", icon: LayoutGrid },
    { label: "Platformlar", href: "/games/platforms", icon: MonitorSmartphone },
    { label: "Geliştiriciler", href: "/games/developers", icon: Code2 },
    { label: "Yayıncılar", href: "/games/publishers", icon: Building2 },
];

const systemRequirementsItem: NavItem = {
    label: "Sistem Gereksinimleri",
    href: "/games/system-requirements",
    icon: Cpu,
};

const allNavItems = [
    ...mainNavItems,
    ...gameServiceItems,
    systemRequirementsItem,
];

/*
 * En uzun eşleşen yol kazanır; "/" (Akış) yalnızca tam eşleşmede aktiftir.
 * Örn. /games/123 -> "Oyunlar", /games/categories -> "Kategoriler".
 */
function resolveActiveHref(pathname: string): string {
    let best = "";

    for (const item of allNavItems) {
        const matches =
            item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

        if (matches && item.href.length > best.length) {
            best = item.href;
        }
    }

    return best;
}

/*
 * Dropdown butonu sadece game-service'in dropdown altındaki sayfalarında aktif olur.
 * Sistem Gereksinimleri ayrı item olduğu için buraya dahil edilmez.
 */
function isGameServiceDropdownPath(pathname: string): boolean {
    return (
        pathname === "/games" ||
        pathname.startsWith("/games/categories") ||
        pathname.startsWith("/games/platforms") ||
        pathname.startsWith("/games/developers") ||
        pathname.startsWith("/games/publishers") ||
        pathname.startsWith("/games/external")
    );
}

function renderNavLink(item: NavItem, activeHref: string) {
    const active = item.href === activeHref;
    const Icon = item.icon;

    return (
        <NavLink
            className={`group relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 2xl:gap-2 2xl:px-3.5 2xl:text-[13px] ${
                active
                    ? "border-violet-400/40 bg-violet-500/15 text-white shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]"
                    : "border-transparent text-slate-400 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
            }`}
            key={item.href}
            to={item.href}
        >
            <Icon
                size={16}
                strokeWidth={2.25}
                className={
                    active
                        ? "text-violet-200"
                        : "text-slate-500 transition-colors group-hover:text-slate-200"
                }
            />

            {item.label}
        </NavLink>
    );
}

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);

    const gameMenuRef = useRef<HTMLDivElement | null>(null);

    /*
     * Sayfa biraz kaydığında navbar kondens olur.
     */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /*
     * Dropdown dışına tıklanınca game-service menüsünü kapatır.
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                gameMenuRef.current &&
                !gameMenuRef.current.contains(event.target as Node)
            ) {
                setIsGameMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /*
     * Route değişince dropdown açık kalmasın.
     */
    useEffect(() => {
        setIsGameMenuOpen(false);
    }, [location.pathname]);

    const displayName = getUserDisplayName(user);
    const roleLabel = getUserRoleLabel(user);
    const initials = getUserInitials(user);
    const activeHref = resolveActiveHref(location.pathname);
    const gameServiceActive = isGameServiceDropdownPath(location.pathname);

    async function handleLogout() {
        setIsLoggingOut(true);

        const refreshToken = getRefreshToken();

        try {
            if (refreshToken) {
                await authService.logout({ refreshToken });
            }
        } catch {
            /* Logout hatası kullanıcıyı engellememeli. */
        } finally {
            clearAuth();
            navigate(ROUTES.login, { replace: true });
        }
    }

    return (
        <header
            className={`sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ${
                scrolled
                    ? "bg-ltz-panel/85 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]"
                    : "bg-ltz-panel/60"
            }`}
        >
            {/* Login dilini yansıtan neon gradient hairline */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent"
            />

            <div
                className={`mx-auto flex w-full max-w-[1840px] items-center gap-3 px-4 transition-[height] duration-300 sm:px-6 lg:px-8 ${
                    scrolled ? "h-14" : "h-16"
                }`}
            >
                {/* Logo */}
                <Link
                    aria-label="Ana akışa git"
                    className="auth-logo-shell flex shrink-0 items-center px-2 py-1"
                    to={ROUTES.home}
                >
                    <img
                        alt="LobbyTwoZero"
                        className={`auth-logo w-auto object-contain transition-[height] duration-300 ${
                            scrolled ? "h-9 sm:h-10" : "h-11 sm:h-12"
                        }`}
                        src={ltzLogo}
                    />
                </Link>

                {/* Bölüm menüsü */}
                <nav className="flex h-full min-w-0 flex-1 items-center gap-2 pl-1 sm:gap-3">
                    {/* Akış */}
                    {mainNavItems.map((item) => renderNavLink(item, activeHref))}

                    {/* Oyunlar dropdown */}
                    <div ref={gameMenuRef} className="relative">
                        <div
                            className={`group relative flex h-9 shrink-0 items-center overflow-hidden rounded-full border text-[11px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 2xl:text-[13px] ${
                                gameServiceActive
                                    ? "border-violet-400/40 bg-violet-500/15 text-white shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]"
                                    : "border-transparent text-slate-400 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                            }`}
                        >
                            <NavLink
                                className="flex h-full items-center gap-1.5 whitespace-nowrap pl-2.5 pr-1 2xl:gap-2 2xl:pl-3.5"
                                to="/games"
                            >
                                <Gamepad2
                                    size={16}
                                    strokeWidth={2.25}
                                    className={
                                        gameServiceActive
                                            ? "text-violet-200"
                                            : "text-slate-500 transition-colors group-hover:text-slate-200"
                                    }
                                />

                                Oyunlar
                            </NavLink>

                            <button
                                aria-expanded={isGameMenuOpen}
                                aria-label="Oyunlar menüsünü aç/kapat"
                                className="mr-1 grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsGameMenuOpen((current) => !current);
                                }}
                                type="button"
                            >
                                <ChevronDown
                                    size={14}
                                    strokeWidth={2.4}
                                    className={`transition-transform duration-200 ${
                                        isGameMenuOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                        </div>

                        {isGameMenuOpen ? (
                            <div className="absolute left-0 top-full z-40 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                                    Game Service
                                </div>

                                <div className="flex flex-col gap-1">
                                    {gameServiceItems.map((item) => {
                                        const active = item.href === activeHref;
                                        const Icon = item.icon;

                                        return (
                                            <NavLink
                                                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                                    active
                                                        ? "bg-violet-500/15 text-violet-100"
                                                        : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                                                }`}
                                                key={item.href}
                                                to={item.href}
                                            >
                        <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
                                active
                                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                                    : "border-white/10 bg-white/[0.03] text-slate-500 group-hover:text-slate-200"
                            }`}
                        >
                          <Icon size={17} strokeWidth={2.25} />
                        </span>

                                                <span className="min-w-0 truncate">{item.label}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Sistem Gereksinimleri: Oyunlar'ın sağında ayrı item */}
                    {renderNavLink(systemRequirementsItem, activeHref)}
                </nav>

                {/* Kullanıcı + çıkış */}
                <div className="flex shrink-0 items-center gap-3">
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
    );
}

export default Navbar;