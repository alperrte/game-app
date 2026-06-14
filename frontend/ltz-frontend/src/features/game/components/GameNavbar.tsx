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
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050b18]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1840px] items-center gap-8 px-8">
        <a className="mr-8 block" href="/games" aria-label="LobbyTwoZero games">
          <div className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-5xl font-black italic leading-none tracking-tight text-transparent">
            LTZ
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.45em] text-white/70">
            Lobby Two Zero
          </div>
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

        <div className="hidden items-center gap-3 lg:flex">
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
