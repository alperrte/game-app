/*
 * Uygulamanın genel, sabit üst navigasyonu.
 *
 * Navbar sırası:
 * Logo | Akış | Sohbet | Keşfet | Topluluklar | Etkinlikler | Oyunlar
 * | İncelemeler | Sistem Gereksinimleri | LTZ Corner | Donanım
 * | Kullanıcı Profili | Çıkış Yap
 *
 * - GameNavbar kullanılmaz.
 * - Sosyal özellikler ortak Navbar içinde yönetilir.
 * - Oyun sayfaları, LTZ Corner ve Donanım modülleri dropdown altında gruplanır.
 * - Profil dropdown içinde profil ve arkadaşlık istekleri bulunur.
 * - Bekleyen arkadaşlık isteği sayısı badge olarak gösterilir.
 * - Scroll sırasında navbar küçülür.
 */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    Brain,
    Building2,
    CalendarDays,
    ChevronDown,
    Code2,
    Compass,
    Cpu,
    Gamepad2,
    Gauge,
    Gift,
    History,
    Home,
    LayoutGrid,
    LogOut,
    MemoryStick,
    MessageCircle,
    MessageSquareText,
    MonitorCog,
    MonitorSmartphone,
    Newspaper,
    Percent,
    ShieldOff,
    Sparkles,
    Star,
    Swords,
    Tag,
    Settings,
    UserPlus,
    UserRound,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "../ui/Button";
import {
    CONTENT_ROUTES,
    HARDWARE_ROUTES,
    ROUTES,
} from "../../lib/constants";
import { getRefreshToken } from "../../lib/token";
import {
    clearAuth,
    useAuthStore,
} from "../../store/authStore";
import { authService } from "../../features/auth/services/authService";
import { BlockedUsersModal } from "../../features/social/components/BlockedUsersModal";
import { FriendRequestsModal } from "../../features/social/components/FriendRequestsModal";
import { socialService } from "../../features/social/services/socialService";

import ltzLogo from "../../assets/ltz-yazi.png";

import {
    getUserDisplayName,
    getUserInitials,
    getUserRoleLabel,
} from "../../utils/authUserDisplay";
import { useCurrentUserProfile } from "../../features/user/context/CurrentUserProfileContext";
import { getImageUrl, isImageValid } from "../../features/user/utils/profileImage";

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const mainNavItems: NavItem[] = [
    {
        label: "Akış",
        href: "/",
        icon: Home,
    },
    {
        label: "Sohbet",
        href: "/messages",
        icon: MessageCircle,
    },
    {
        label: "Keşfet",
        href: "/explore",
        icon: Compass,
    },
    {
        label: "Topluluklar",
        href: "/communities",
        icon: Users,
    },
    {
        label: "Etkinlikler",
        href: "/events",
        icon: CalendarDays,
    },
];

const gameServiceItems: NavItem[] = [
    {
        label: "Oyunlar",
        href: "/games",
        icon: Gamepad2,
    },
    {
        label: "Kategoriler",
        href: "/games/categories",
        icon: LayoutGrid,
    },
    {
        label: "Platformlar",
        href: "/games/platforms",
        icon: MonitorSmartphone,
    },
    {
        label: "Geliştiriciler",
        href: "/games/developers",
        icon: Code2,
    },
    {
        label: "Yayıncılar",
        href: "/games/publishers",
        icon: Building2,
    },
];

const reviewsItem: NavItem = {
    label: "İncelemeler",
    href: "/reviews",
    icon: MessageSquareText,
};

const systemRequirementsItem: NavItem = {
    label: "Sistem Gereksinimleri",
    href: "/games/system-requirements",
    icon: Cpu,
};

const contentCornerItems: NavItem[] = [
    {
        label: "Ana Panel",
        href: CONTENT_ROUTES.hub,
        icon: Sparkles,
    },
    {
        label: "İndirimler",
        href: CONTENT_ROUTES.deals,
        icon: Percent,
    },
    {
        label: "Haberler",
        href: CONTENT_ROUTES.news,
        icon: Newspaper,
    },
    {
        label: "Espor",
        href: CONTENT_ROUTES.esports,
        icon: Swords,
    },
    {
        label: "Ücretsiz",
        href: CONTENT_ROUTES.free,
        icon: Gift,
    },
    {
        label: "Trivia",
        href: CONTENT_ROUTES.trivia,
        icon: Brain,
    },
    {
        label: "Tarih",
        href: CONTENT_ROUTES.history,
        icon: History,
    },
];

const hardwareServiceItems: NavItem[] = [
    {
        label: "Hardware Center",
        href: HARDWARE_ROUTES.center,
        icon: MonitorCog,
    },
    {
        label: "Sistemim",
        href: HARDWARE_ROUTES.mySystem,
        icon: Cpu,
    },
    {
        label: "Bileşenler",
        href: HARDWARE_ROUTES.components,
        icon: MemoryStick,
    },
    {
        label: "FPS Raporları",
        href: HARDWARE_ROUTES.fpsReports,
        icon: Gauge,
    },
    {
        label: "Donanım İncelemeleri",
        href: HARDWARE_ROUTES.reviews,
        icon: Star,
    },
    {
        label: "Kampanyalar",
        href: HARDWARE_ROUTES.deals,
        icon: Tag,
    },
];

const allNavItems: NavItem[] = [
    ...mainNavItems,
    ...gameServiceItems,
    reviewsItem,
    systemRequirementsItem,
    ...contentCornerItems,
    ...hardwareServiceItems,
];

/*
 * Aktif route belirlenirken en uzun eşleşen yol seçilir.
 *
 * Örnek:
 * /games/12 -> /games
 * /games/categories -> /games/categories
 * /messages/5 -> /messages
 */
function resolveActiveHref(pathname: string): string {
    let bestMatch = "";

    for (const item of allNavItems) {
        const matches =
            item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

        if (matches && item.href.length > bestMatch.length) {
            bestMatch = item.href;
        }
    }

    return bestMatch;
}

/*
 * Sistem Gereksinimleri ayrı navbar itemidir.
 * Bu nedenle Oyunlar dropdown aktifliğine dahil edilmez.
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

function isContentCornerPath(pathname: string): boolean {
    return (
        pathname === CONTENT_ROUTES.hub ||
        pathname.startsWith(`${CONTENT_ROUTES.hub}/`)
    );
}

function isHardwareServicePath(pathname: string): boolean {
    return (
        pathname === HARDWARE_ROUTES.center ||
        pathname.startsWith(`${HARDWARE_ROUTES.center}/`)
    );
}

function renderNavDropdownPanel(
    items: NavItem[],
    activeHref: string,
    sectionLabel: string,
    onItemClick?: () => void,
) {
    return (
        <div
            className="
                absolute left-0 top-full
                z-50 mt-3 w-72
                overflow-hidden
                rounded-2xl
                border border-white/10
                bg-slate-950/95
                p-2
                shadow-2xl shadow-black/50
                backdrop-blur-xl
            "
        >
            <div
                className="
                    px-3 py-2
                    text-[10px] font-bold
                    uppercase
                    tracking-[0.24em]
                    text-slate-500
                "
            >
                {sectionLabel}
            </div>

            <div className="flex flex-col gap-1">
                {items.map((item) => {
                    const active = item.href === activeHref;
                    const Icon = item.icon;
                    const exactMatch =
                        item.href === CONTENT_ROUTES.hub ||
                        item.href === "/games" ||
                        item.href === HARDWARE_ROUTES.center;

                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={exactMatch}
                            onClick={onItemClick}
                            className={`
                                group flex
                                items-center
                                gap-3
                                rounded-xl
                                px-3 py-2.5
                                text-sm
                                font-semibold
                                transition
                                ${
                                active
                                    ? `
                                            bg-violet-500/15
                                            text-violet-100
                                          `
                                    : `
                                            text-slate-400
                                            hover:bg-white/[0.04]
                                            hover:text-white
                                          `
                            }
                            `}
                        >
                            <span
                                className={`
                                    grid h-9 w-9
                                    shrink-0
                                    place-items-center
                                    rounded-lg
                                    border
                                    transition
                                    ${
                                    active
                                        ? `
                                                border-violet-400/40
                                                bg-violet-500/15
                                                text-violet-200
                                              `
                                        : `
                                                border-white/10
                                                bg-white/[0.03]
                                                text-slate-500
                                                group-hover:text-slate-200
                                              `
                                }
                                `}
                            >
                                <Icon size={17} strokeWidth={2.25} />
                            </span>

                            <span className="min-w-0 truncate">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}

function renderNavLink(
    item: NavItem,
    activeHref: string,
) {
    const active = item.href === activeHref;
    const Icon = item.icon;

    return (
        <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={`
                group relative flex h-9 shrink-0 items-center
                gap-1.5 whitespace-nowrap rounded-full border
                px-2.5 text-[11px] font-semibold
                transition-[color,background-color,border-color,box-shadow,transform]
                duration-200
                2xl:gap-2 2xl:px-3.5 2xl:text-[13px]
                ${
                active
                    ? `
                            border-violet-400/40
                            bg-violet-500/15
                            text-white
                            shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]
                          `
                    : `
                            border-transparent
                            text-slate-400
                            hover:-translate-y-0.5
                            hover:border-white/10
                            hover:bg-white/[0.04]
                            hover:text-white
                          `
            }
            `}
        >
            <Icon
                size={16}
                strokeWidth={2.25}
                className={
                    active
                        ? "text-violet-200"
                        : `
                            text-slate-500
                            transition-colors
                            group-hover:text-slate-200
                          `
                }
            />

            <span>{item.label}</span>
        </NavLink>
    );
}

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuthStore();
    const { avatarUrl } = useCurrentUserProfile();

    const gameMenuRef = useRef<HTMLDivElement | null>(null);
    const contentMenuRef = useRef<HTMLDivElement | null>(null);
    const hardwareMenuRef = useRef<HTMLDivElement | null>(null);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [isGameMenuOpen, setIsGameMenuOpen] =
        useState(false);

    const [isContentMenuOpen, setIsContentMenuOpen] =
        useState(false);

    const [isHardwareMenuOpen, setIsHardwareMenuOpen] =
        useState(false);

    const [profileMenuOpen, setProfileMenuOpen] =
        useState(false);

    const [friendRequestsOpen, setFriendRequestsOpen] =
        useState(false);

    const [blockedUsersOpen, setBlockedUsersOpen] =
        useState(false);

    const [pendingRequestCount, setPendingRequestCount] =
        useState(0);

    const displayName = getUserDisplayName(user);
    const roleLabel = getUserRoleLabel(user);
    const initials = getUserInitials(user);

    const activeHref = resolveActiveHref(location.pathname);

    const gameServiceActive =
        isGameServiceDropdownPath(location.pathname);

    const contentCornerActive = isContentCornerPath(
        location.pathname,
    );

    const hardwareServiceActive = isHardwareServicePath(
        location.pathname,
    );

    const profileActive =
        Boolean(user?.username) &&
        location.pathname.startsWith(
            `/profile/${user?.username}`,
        );

    /*
     * Bekleyen arkadaşlık isteklerini getirir.
     */
    const refreshPendingRequestCount =
        useCallback(async () => {
            if (!user?.userId) {
                setPendingRequestCount(0);
                return;
            }

            try {
                const requests =
                    await socialService.getIncomingFriendRequests(
                        user.userId,
                    );

                setPendingRequestCount(requests.length);
            } catch {
                setPendingRequestCount(0);
            }
        }, [user]);

    /*
     * İlk yüklemede ve kullanıcı değiştiğinde
     * arkadaşlık isteği sayısını günceller.
     */
    useEffect(() => {
        Promise.resolve().then(() => {
            void refreshPendingRequestCount();
        });
    }, [refreshPendingRequestCount]);

    /*
     * Sayfa biraz aşağı kayınca navbar küçülür.
     */
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 8);
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
        };
    }, []);

    /*
     * Dropdown dışına tıklandığında açık menüleri kapatır.
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const clickedNode = event.target as Node;

            if (
                gameMenuRef.current &&
                !gameMenuRef.current.contains(clickedNode)
            ) {
                setIsGameMenuOpen(false);
            }

            if (
                contentMenuRef.current &&
                !contentMenuRef.current.contains(clickedNode)
            ) {
                setIsContentMenuOpen(false);
            }

            if (
                hardwareMenuRef.current &&
                !hardwareMenuRef.current.contains(clickedNode)
            ) {
                setIsHardwareMenuOpen(false);
            }

            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(clickedNode)
            ) {
                setProfileMenuOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, []);

    /*
     * Route değiştiğinde açık dropdownlar kapatılır.
     */
    useEffect(() => {
        Promise.resolve().then(() => {
            setIsGameMenuOpen(false);
            setIsContentMenuOpen(false);
            setIsHardwareMenuOpen(false);
            setProfileMenuOpen(false);
        });
    }, [location.pathname]);

    async function handleLogout() {
        setIsLoggingOut(true);

        const refreshToken = getRefreshToken();

        try {
            if (refreshToken) {
                await authService.logout({
                    refreshToken,
                });
            }
        } catch {
            /*
             * Backend logout hatası kullanıcının
             * çıkış yapmasını engellememeli.
             */
        } finally {
            clearAuth();

            navigate(ROUTES.login, {
                replace: true,
            });
        }
    }

    function handleOpenProfile() {
        if (!user?.username) {
            return;
        }

        setProfileMenuOpen(false);

        navigate(`/profile/${user.username}`);
    }

    function handleOpenFriendRequests() {
        setProfileMenuOpen(false);
        setFriendRequestsOpen(true);
    }

    function handleOpenBlockedUsers() {
        setProfileMenuOpen(false);
        setBlockedUsersOpen(true);
    }

    function handleOpenSettings() {
        if (!user?.username) {
            return;
        }
        setProfileMenuOpen(false);
        navigate(`/profile/${user.username}?settings=true`);
    }

    return (
        <>
            <header
                className={`
                    sticky top-0 z-30
                    border-b border-white/5
                    backdrop-blur-xl
                    transition-[background-color,box-shadow]
                    duration-300
                    ${
                    scrolled
                        ? `
                                bg-ltz-panel/85
                                shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]
                              `
                        : "bg-ltz-panel/60"
                }
                `}
            >
                {/* Alt neon çizgi */}
                <span
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute inset-x-0 bottom-0
                        h-px
                        bg-gradient-to-r
                        from-transparent
                        via-violet-500/60
                        to-transparent
                    "
                />

                <div
                    className={`
                        mx-auto flex w-full max-w-[1840px]
                        items-center gap-2
                        px-4
                        transition-[height]
                        duration-300
                        sm:gap-3 sm:px-6
                        lg:px-8
                        ${
                        scrolled
                            ? "h-14"
                            : "h-16"
                    }
                    `}
                >
                    {/* Logo */}
                    <Link
                        aria-label="Ana akışa git"
                        className="
                            auth-logo-shell
                            flex shrink-0 items-center
                            px-2 py-1
                        "
                        to={ROUTES.home}
                    >
                        <img
                            alt="LobbyTwoZero"
                            src={ltzLogo}
                            className={`
                                auth-logo
                                w-auto object-contain
                                transition-[height]
                                duration-300
                                ${
                                scrolled
                                    ? "h-9 sm:h-10"
                                    : "h-11 sm:h-12"
                            }
                            `}
                        />
                    </Link>

                    {/* Ana navigasyon */}
                    <nav
                        className="
                            flex h-full min-w-0 flex-1
                            items-center gap-2
                            overflow-visible
                            pl-1
                            [scrollbar-width:none]
                            sm:gap-3
                            [&::-webkit-scrollbar]:hidden
                        "
                    >
                        {mainNavItems.map((item) =>
                            renderNavLink(item, activeHref),
                        )}

                        {/* Oyunlar dropdown */}
                        <div
                            ref={gameMenuRef}
                            className="relative shrink-0"
                        >
                            <div
                                className={`
                                    group relative flex h-9
                                    shrink-0 items-center
                                    overflow-hidden rounded-full
                                    border
                                    text-[11px] font-semibold
                                    transition-[color,background-color,border-color,box-shadow,transform]
                                    duration-200
                                    2xl:text-[13px]
                                    ${
                                    gameServiceActive
                                        ? `
                                                border-violet-400/40
                                                bg-violet-500/15
                                                text-white
                                                shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]
                                              `
                                        : `
                                                border-transparent
                                                text-slate-400
                                                hover:-translate-y-0.5
                                                hover:border-white/10
                                                hover:bg-white/[0.04]
                                                hover:text-white
                                              `
                                }
                                `}
                            >
                                <NavLink
                                    to="/games"
                                    className="
                                        flex h-full items-center
                                        gap-1.5 whitespace-nowrap
                                        pl-2.5 pr-1
                                        2xl:gap-2 2xl:pl-3.5
                                    "
                                >
                                    <Gamepad2
                                        size={16}
                                        strokeWidth={2.25}
                                        className={
                                            gameServiceActive
                                                ? "text-violet-200"
                                                : `
                                                    text-slate-500
                                                    transition-colors
                                                    group-hover:text-slate-200
                                                  `
                                        }
                                    />

                                    <span>Oyunlar</span>
                                </NavLink>

                                <button
                                    type="button"
                                    aria-expanded={
                                        isGameMenuOpen
                                    }
                                    aria-label="Oyunlar menüsünü aç veya kapat"
                                    className="
                                        mr-1 grid h-7 w-7
                                        place-items-center
                                        rounded-full
                                        text-slate-400
                                        transition
                                        hover:bg-white/10
                                        hover:text-white
                                    "
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        setProfileMenuOpen(
                                            false,
                                        );

                                        setIsContentMenuOpen(
                                            false,
                                        );

                                        setIsHardwareMenuOpen(
                                            false,
                                        );

                                        setIsGameMenuOpen(
                                            (current) =>
                                                !current,
                                        );
                                    }}
                                >
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={2.4}
                                        className={`
                                            transition-transform
                                            duration-200
                                            ${
                                            isGameMenuOpen
                                                ? "rotate-180"
                                                : ""
                                        }
                                        `}
                                    />
                                </button>
                            </div>

                            {isGameMenuOpen
                                ? renderNavDropdownPanel(
                                    gameServiceItems,
                                    activeHref,
                                    "GAME SERVICE",
                                    () => setIsGameMenuOpen(false),
                                )
                                : null}
                        </div>

                        {renderNavLink(
                            reviewsItem,
                            activeHref,
                        )}

                        {renderNavLink(
                            systemRequirementsItem,
                            activeHref,
                        )}

                        {/* Oyun Merkezi dropdown */}
                        <div
                            ref={contentMenuRef}
                            className="relative shrink-0"
                        >
                            <div
                                className={`
                                    group relative flex h-9
                                    shrink-0 items-center
                                    overflow-hidden rounded-full
                                    border
                                    text-[11px] font-semibold
                                    transition-[color,background-color,border-color,box-shadow,transform]
                                    duration-200
                                    2xl:text-[13px]
                                    ${
                                    contentCornerActive
                                        ? `
                                                border-violet-400/40
                                                bg-violet-500/15
                                                text-white
                                                shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]
                                              `
                                        : `
                                                border-transparent
                                                text-slate-400
                                                hover:-translate-y-0.5
                                                hover:border-white/10
                                                hover:bg-white/[0.04]
                                                hover:text-white
                                              `
                                }
                                `}
                            >
                                <NavLink
                                    to={CONTENT_ROUTES.hub}
                                    className="
                                        flex h-full items-center
                                        gap-1.5 whitespace-nowrap
                                        pl-2.5 pr-1
                                        2xl:gap-2 2xl:pl-3.5
                                    "
                                >
                                    <Sparkles
                                        size={16}
                                        strokeWidth={2.25}
                                        className={
                                            contentCornerActive
                                                ? "text-violet-200"
                                                : `
                                                    text-slate-500
                                                    transition-colors
                                                    group-hover:text-slate-200
                                                  `
                                        }
                                    />

                                    <span>Oyun Merkezi</span>
                                </NavLink>

                                <button
                                    type="button"
                                    aria-expanded={
                                        isContentMenuOpen
                                    }
                                    aria-label="Oyun Merkezi menüsünü aç veya kapat"
                                    className="
                                        mr-1 grid h-7 w-7
                                        place-items-center
                                        rounded-full
                                        text-slate-400
                                        transition
                                        hover:bg-white/10
                                        hover:text-white
                                    "
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        setProfileMenuOpen(
                                            false,
                                        );
                                        setIsGameMenuOpen(
                                            false,
                                        );

                                        setIsHardwareMenuOpen(
                                            false,
                                        );

                                        setIsContentMenuOpen(
                                            (current) =>
                                                !current,
                                        );
                                    }}
                                >
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={2.4}
                                        className={`
                                            transition-transform
                                            duration-200
                                            ${
                                            isContentMenuOpen
                                                ? "rotate-180"
                                                : ""
                                        }
                                        `}
                                    />
                                </button>
                            </div>

                            {isContentMenuOpen
                                ? renderNavDropdownPanel(
                                    contentCornerItems,
                                    activeHref,
                                    "LTZ CORNER",
                                    () =>
                                        setIsContentMenuOpen(
                                            false,
                                        ),
                                )
                                : null}
                        </div>

                        {/* Donanım dropdown */}
                        <div
                            ref={hardwareMenuRef}
                            className="relative shrink-0"
                        >
                            <div
                                className={`
                                    group relative flex h-9
                                    shrink-0 items-center
                                    overflow-hidden rounded-full
                                    border
                                    text-[11px] font-semibold
                                    transition-[color,background-color,border-color,box-shadow,transform]
                                    duration-200
                                    2xl:text-[13px]
                                    ${
                                    hardwareServiceActive
                                        ? `
                                                border-violet-400/40
                                                bg-violet-500/15
                                                text-white
                                                shadow-[0_0_18px_-4px_rgba(139,92,246,0.6),inset_0_0_14px_-6px_rgba(168,85,247,0.8)]
                                              `
                                        : `
                                                border-transparent
                                                text-slate-400
                                                hover:-translate-y-0.5
                                                hover:border-white/10
                                                hover:bg-white/[0.04]
                                                hover:text-white
                                              `
                                }
                                `}
                            >
                                <NavLink
                                    to={HARDWARE_ROUTES.center}
                                    end
                                    className="
                                        flex h-full items-center
                                        gap-1.5 whitespace-nowrap
                                        pl-2.5 pr-1
                                        2xl:gap-2 2xl:pl-3.5
                                    "
                                >
                                    <MonitorCog
                                        size={16}
                                        strokeWidth={2.25}
                                        className={
                                            hardwareServiceActive
                                                ? "text-violet-200"
                                                : `
                                                    text-slate-500
                                                    transition-colors
                                                    group-hover:text-slate-200
                                                  `
                                        }
                                    />

                                    <span>Donanım</span>
                                </NavLink>

                                <button
                                    type="button"
                                    aria-expanded={
                                        isHardwareMenuOpen
                                    }
                                    aria-label="Donanım menüsünü aç veya kapat"
                                    className="
                                        mr-1 grid h-7 w-7
                                        place-items-center
                                        rounded-full
                                        text-slate-400
                                        transition
                                        hover:bg-white/10
                                        hover:text-white
                                    "
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        setProfileMenuOpen(
                                            false,
                                        );
                                        setIsGameMenuOpen(
                                            false,
                                        );
                                        setIsContentMenuOpen(
                                            false,
                                        );

                                        setIsHardwareMenuOpen(
                                            (current) =>
                                                !current,
                                        );
                                    }}
                                >
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={2.4}
                                        className={`
                                            transition-transform
                                            duration-200
                                            ${
                                            isHardwareMenuOpen
                                                ? "rotate-180"
                                                : ""
                                        }
                                        `}
                                    />
                                </button>
                            </div>

                            {isHardwareMenuOpen
                                ? renderNavDropdownPanel(
                                    hardwareServiceItems,
                                    activeHref,
                                    "HARDWARE SERVICE",
                                    () =>
                                        setIsHardwareMenuOpen(
                                            false,
                                        ),
                                )
                                : null}
                        </div>
                    </nav>

                    {/* Kullanıcı alanı */}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {user ? (
                            <div
                                ref={profileMenuRef}
                                className="relative hidden sm:block"
                            >
                                <button
                                    type="button"
                                    aria-expanded={
                                        profileMenuOpen
                                    }
                                    aria-haspopup="menu"
                                    onClick={() => {
                                        setIsGameMenuOpen(
                                            false,
                                        );
                                        setIsContentMenuOpen(
                                            false,
                                        );
                                        setIsHardwareMenuOpen(
                                            false,
                                        );

                                        setProfileMenuOpen(
                                            (current) =>
                                                !current,
                                        );
                                    }}
                                    className={`
                                        group flex items-center
                                        gap-3 rounded-xl
                                        border px-2 py-1.5
                                        transition
                                        ${
                                        profileMenuOpen ||
                                        profileActive
                                            ? `
                                                    border-violet-400/40
                                                    bg-violet-500/10
                                                    shadow-[0_0_20px_rgba(139,92,246,0.22)]
                                                  `
                                            : `
                                                    border-transparent
                                                    hover:border-white/10
                                                    hover:bg-white/[0.04]
                                                  `
                                    }
                                    `}
                                >
                                    <div className="relative">
                                        {avatarUrl && isImageValid(avatarUrl) ? (
                                            <img
                                                src={getImageUrl(avatarUrl)}
                                                alt={displayName}
                                                className={`
                                                    h-9 w-9
                                                    rounded-full
                                                    object-cover
                                                    border border-white/20
                                                    transition
                                                    ${
                                                    profileMenuOpen
                                                        ? "scale-105"
                                                        : ""
                                                }
                                                `}
                                            />
                                        ) : (
                                            <div
                                                className={`
                                                    grid h-9 w-9
                                                    place-items-center
                                                    rounded-full
                                                    bg-gradient-to-br
                                                    from-violet-300
                                                    to-fuchsia-600
                                                    text-xs font-bold
                                                    text-slate-950
                                                    transition
                                                    ${
                                                    profileMenuOpen
                                                        ? "scale-105"
                                                        : ""
                                                }
                                                `}
                                            >
                                                {initials}
                                            </div>
                                        )}

                                        {pendingRequestCount >
                                        0 ? (
                                            <span
                                                className="
                                                    absolute -right-1
                                                    -top-1
                                                    grid h-5 min-w-5
                                                    place-items-center
                                                    rounded-full
                                                    border-2
                                                    border-slate-950
                                                    bg-violet-600
                                                    px-1
                                                    text-[9px]
                                                    font-bold
                                                    text-white
                                                "
                                            >
                                                {pendingRequestCount >
                                                99
                                                    ? "99+"
                                                    : pendingRequestCount}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="hidden min-w-0 text-left lg:block">
                                        <div className="max-w-40 truncate text-sm font-semibold text-white">
                                            {displayName}
                                        </div>

                                        {roleLabel ? (
                                            <div className="max-w-40 truncate text-xs text-zinc-400">
                                                {roleLabel}
                                            </div>
                                        ) : null}
                                    </div>

                                    <ChevronDown
                                        size={15}
                                        strokeWidth={2.3}
                                        className={`
                                            hidden text-slate-500
                                            transition
                                            group-hover:text-white
                                            lg:block
                                            ${
                                            profileMenuOpen
                                                ? "rotate-180 text-violet-300"
                                                : ""
                                        }
                                        `}
                                    />
                                </button>

                                {profileMenuOpen ? (
                                    <div
                                        role="menu"
                                        className="
                                            absolute right-0
                                            top-[calc(100%+10px)]
                                            z-50
                                            min-w-[240px]
                                            overflow-hidden
                                            rounded-2xl
                                            border border-white/10
                                            bg-slate-950/95
                                            p-2
                                            shadow-2xl
                                            shadow-black/50
                                            backdrop-blur-xl
                                        "
                                    >
                                        <div
                                            className="
                                                border-b
                                                border-white/5
                                                px-3 pb-3 pt-2
                                            "
                                        >
                                            <div className="truncate text-sm font-semibold text-white">
                                                {displayName}
                                            </div>

                                            {roleLabel ? (
                                                <div className="mt-0.5 truncate text-xs text-slate-500">
                                                    {
                                                        roleLabel
                                                    }
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-2 flex flex-col gap-1">
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={
                                                    handleOpenProfile
                                                }
                                                className="
                                                    group flex w-full
                                                    items-center gap-3
                                                    rounded-xl
                                                    px-3 py-2.5
                                                    text-left
                                                    text-sm
                                                    font-semibold
                                                    text-slate-300
                                                    transition
                                                    hover:bg-white/[0.05]
                                                    hover:text-white
                                                "
                                            >
                                                <span
                                                    className="
                                                        grid h-9 w-9
                                                        place-items-center
                                                        rounded-lg
                                                        border
                                                        border-white/10
                                                        bg-white/[0.03]
                                                        text-violet-300
                                                    "
                                                >
                                                    <UserRound
                                                        size={
                                                            17
                                                        }
                                                        strokeWidth={
                                                            2.25
                                                        }
                                                    />
                                                </span>

                                                Profil
                                            </button>

                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={
                                                    handleOpenFriendRequests
                                                }
                                                className="
                                                    group flex w-full
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                    rounded-xl
                                                    px-3 py-2.5
                                                    text-left
                                                    text-sm
                                                    font-semibold
                                                    text-slate-300
                                                    transition
                                                    hover:bg-white/[0.05]
                                                    hover:text-white
                                                "
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span
                                                        className="
                                                            grid h-9 w-9
                                                            place-items-center
                                                            rounded-lg
                                                            border
                                                            border-white/10
                                                            bg-white/[0.03]
                                                            text-indigo-300
                                                        "
                                                    >
                                                        <UserPlus
                                                            size={
                                                                17
                                                            }
                                                            strokeWidth={
                                                                2.25
                                                            }
                                                        />
                                                    </span>

                                                    Arkadaşlık
                                                    İstekleri
                                                </span>

                                                {pendingRequestCount >
                                                0 ? (
                                                    <span
                                                        className="
                                                            grid h-6
                                                            min-w-6
                                                            place-items-center
                                                            rounded-full
                                                            bg-violet-600
                                                            px-1.5
                                                            text-[10px]
                                                            font-bold
                                                            text-white
                                                        "
                                                    >
                                                        {pendingRequestCount >
                                                        99
                                                            ? "99+"
                                                            : pendingRequestCount}
                                                    </span>
                                                ) : null}
                                            </button>

                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={
                                                    handleOpenBlockedUsers
                                                }
                                                className="
                                                    group flex w-full
                                                    items-center gap-3
                                                    rounded-xl
                                                    px-3 py-2.5
                                                    text-left
                                                    text-sm
                                                    font-semibold
                                                    text-slate-300
                                                    transition
                                                    hover:bg-white/[0.05]
                                                    hover:text-white
                                                "
                                            >
                                                <span
                                                    className="
                                                        grid h-9 w-9
                                                        place-items-center
                                                        rounded-lg
                                                        border
                                                        border-white/10
                                                        bg-white/[0.03]
                                                        text-rose-300
                                                    "
                                                >
                                                    <ShieldOff
                                                        size={
                                                            17
                                                        }
                                                        strokeWidth={
                                                            2.25
                                                        }
                                                    />
                                                </span>

                                                Engellenen
                                                Kullanıcılar
                                            </button>

                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={
                                                    handleOpenSettings
                                                }
                                                className="
                                                    group flex w-full
                                                    items-center gap-3
                                                    rounded-xl
                                                    px-3 py-2.5
                                                    text-left
                                                    text-sm
                                                    font-semibold
                                                    text-slate-300
                                                    transition
                                                    hover:bg-white/[0.05]
                                                    hover:text-white
                                                "
                                            >
                                                <span
                                                    className="
                                                        grid h-9 w-9
                                                        place-items-center
                                                        rounded-lg
                                                        border
                                                        border-white/10
                                                        bg-white/[0.03]
                                                        text-violet-300
                                                    "
                                                >
                                                    <Settings
                                                        size={
                                                            17
                                                        }
                                                        strokeWidth={
                                                            2.25
                                                        }
                                                    />
                                                </span>

                                                Ayarlar
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <Button
                            type="button"
                            variant="ghost"
                            className="
                                h-9 px-2 text-xs
                                sm:px-3
                            "
                            isLoading={isLoggingOut}
                            leftIcon={
                                <LogOut size={15} />
                            }
                            onClick={() =>
                                void handleLogout()
                            }
                        >
                            <span className="hidden xl:inline">
                                Çıkış Yap
                            </span>
                        </Button>
                    </div>
                </div>
            </header>

            <FriendRequestsModal
                open={friendRequestsOpen}
                onClose={() =>
                    setFriendRequestsOpen(false)
                }
                onRequestsChanged={() =>
                    void refreshPendingRequestCount()
                }
            />

            <BlockedUsersModal
                open={blockedUsersOpen}
                onClose={() =>
                    setBlockedUsersOpen(false)
                }
            />
        </>
    );
}

export default Navbar;
