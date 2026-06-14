import type { MouseEvent, ReactNode } from "react";

type NavigationItem = {
  label: string;
  to: string;
};

type MainLayoutProps = {
  children: ReactNode;
  currentPath: string;
  navigationItems: NavigationItem[];
};

const isActivePath = (currentPath: string, itemPath: string) => {
  if (itemPath === "/games") {
    return currentPath === "/" || currentPath === "/games";
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
};

const navigate = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("popstate"));
};

const MainLayout = ({
  children,
  currentPath,
  navigationItems,
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a
            className="text-lg font-semibold tracking-wide"
            href="/games"
            onClick={(event) => navigate(event, "/games")}
          >
            LTZ Game Service
          </a>
          <span className="text-sm text-slate-400">API Gateway</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const active = isActivePath(currentPath, item.to);

              return (
                <a
                  className={`block rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  href={item.to}
                  key={item.to}
                  onClick={(event) => navigate(event, item.to)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
