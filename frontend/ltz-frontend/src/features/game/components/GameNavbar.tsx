import { NavLink } from "react-router-dom";

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
  {
    key: "Categories",
    label: "Kategoriler",
    href: "/games/categories",
    icon: "⬡",
  },
  {
    key: "Platforms",
    label: "Platformlar",
    href: "/games/platforms",
    icon: "▭",
  },
  {
    key: "Developers",
    label: "Geliştiriciler",
    href: "/games/developers",
    icon: "♙",
  },
  {
    key: "Publishers",
    label: "Yayıncılar",
    href: "/games/publishers",
    icon: "▥",
  },
  {
    key: "SystemRequirements",
    label: "Sistem Gereksinimleri",
    href: "/games/system-requirements",
    icon: "S",
  },
] as const;

const GameNavbar = ({ activeItem }: GameNavbarProps) => {
  return (
    <header className="sticky top-14 z-20 border-b border-white/10 bg-[#050b18]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1840px] items-center px-4 sm:px-6 lg:px-8">
        <nav className="flex h-full min-w-0 flex-1 items-center gap-3 overflow-x-auto [scrollbar-width:none] 2xl:gap-4 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = item.key === activeItem;

            return (
              <NavLink
                className={`relative flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-1 text-[11px] font-semibold transition hover:-translate-y-0.5 2xl:gap-2 2xl:text-[13px] ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
                end={item.key === "Feed"}
                key={item.key}
                to={item.href}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-black transition ${
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
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default GameNavbar;