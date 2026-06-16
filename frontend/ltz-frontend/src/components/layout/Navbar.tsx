/*
 * Uygulamanın genel, sabit (sticky) üst navigasyonu.
 *
 * Tek sıra: logo (ana akışa link + login'deki glow efekti) + bölüm menüsü
 * (lucide ikonları, aktif sekme neon pill) + kullanıcı + çıkış.
 *
 * - Aktif sekme, en uzun eşleşen yola göre otomatik belirlenir.
 * - Scroll'da kondens olur (incelir, blur/gölge artar) — daha canlı his.
 * - Alt kenarda login dilini yansıtan neon gradient hairline.
 */

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    Building2,
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

const navItems: NavItem[] = [
    { label: "Akış", href: "/", icon: Home },
    { label: "Oyunlar", href: "/games", icon: Gamepad2 },
    { label: "Kategoriler", href: "/games/categories", icon: LayoutGrid },
    { label: "Platformlar", href: "/games/platforms", icon: MonitorSmartphone },
    { label: "Geliştiriciler", href: "/games/developers", icon: Code2 },
    { label: "Yayıncılar", href: "/games/publishers", icon: Building2 },
    {
        label: "Sistem Gereksinimleri",
        href: "/games/system-requirements",
        icon: Cpu,
    },
];

/*
 * En uzun eşleşen yol kazanır; "/" (Akış) yalnızca tam eşleşmede aktiftir.
 * Örn. /games/123 -> "Oyunlar", /games/categories -> "Kategoriler".
 */
function resolveActiveHref(pathname: string): string {
    let best = "";

    for (const item of navItems) {
        const matches =
            item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

        if (matches && item.href.length > best.length) {
            best = item.href;
        }
    }

    return best;
}

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    /*
     * Sayfa biraz kaydığında navbar kondens olur (incelir + gölge/blur artar).
     */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const displayName = getUserDisplayName(user);
    const roleLabel = getUserRoleLabel(user);
    const initials = getUserInitials(user);
    const activeHref = resolveActiveHref(location.pathname);

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

                {/* Bölüm menüsü: logonun yanında, kenarları fade'li yatay kaydırma */}
                <nav className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto pl-1 [-ms-overflow-style:none] [mask-image:linear-gradient(to_right,#000_0,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden">
                    {navItems.map((item) => {
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
                    })}
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
