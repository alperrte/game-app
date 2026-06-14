import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import MainLayout from "./MainLayout";
import { GAME_ROUTES } from "../lib/constants";
import GameCategoriesPage from "../features/game/pages/GameCategoriesPage";
import GameCreatePage from "../features/game/pages/GameCreatePage";
import GameDetailPage from "../features/game/pages/GameDetailPage";
import GameDevelopersPage from "../features/game/pages/GameDevelopersPage";
import GameEditPage from "../features/game/pages/GameEditPage";
import GamePlatformsPage from "../features/game/pages/GamePlatformsPage";
import GamePublishersPage from "../features/game/pages/GamePublishersPage";
import GamesPage from "../features/game/pages/GamesPage";
import GameSystemRequirementsPage from "../features/game/pages/GameSystemRequirementsPage";

type AppRoute = {
  Component: ComponentType;
  isMatch: (pathname: string) => boolean;
};

const gameNavigationItems = [
  { label: "Oyunlar", to: GAME_ROUTES.games },
  { label: "Populer Oyunlar", to: GAME_ROUTES.popularGames },
  { label: "Oyun Olustur", to: GAME_ROUTES.createGame },
  { label: "Kategoriler", to: GAME_ROUTES.categories },
  { label: "Platformlar", to: GAME_ROUTES.platforms },
  { label: "Gelistiriciler", to: GAME_ROUTES.developers },
  { label: "Yayincilar", to: GAME_ROUTES.publishers },
];

const normalizePath = (pathname: string) => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const routes: AppRoute[] = [
  {
    Component: GamesPage,
    isMatch: (pathname) =>
      pathname === "/" ||
      pathname === GAME_ROUTES.games ||
      pathname === GAME_ROUTES.popularGames,
  },
  {
    Component: GameCreatePage,
    isMatch: (pathname) => pathname === GAME_ROUTES.createGame,
  },
  {
    Component: GameCategoriesPage,
    isMatch: (pathname) => pathname === GAME_ROUTES.categories,
  },
  {
    Component: GamePlatformsPage,
    isMatch: (pathname) => pathname === GAME_ROUTES.platforms,
  },
  {
    Component: GameDevelopersPage,
    isMatch: (pathname) => pathname === GAME_ROUTES.developers,
  },
  {
    Component: GamePublishersPage,
    isMatch: (pathname) => pathname === GAME_ROUTES.publishers,
  },
  {
    Component: GameSystemRequirementsPage,
    isMatch: (pathname) => pathname === GAME_ROUTES.systemRequirements,
  },
  {
    Component: GameSystemRequirementsPage,
    isMatch: (pathname) => /^\/games\/[^/]+\/system-requirements$/.test(pathname),
  },
  {
    Component: GameEditPage,
    isMatch: (pathname) => /^\/games\/[^/]+\/edit$/.test(pathname),
  },
  {
    Component: GameDetailPage,
    isMatch: (pathname) => /^\/games\/[^/]+$/.test(pathname),
  },
];

const getRoute = (pathname: string) => {
  return routes.find((route) => route.isMatch(pathname)) ?? routes[0];
};

export const AppRouter = () => {
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    const syncPathname = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", syncPathname);

    return () => {
      window.removeEventListener("popstate", syncPathname);
    };
  }, []);

  const route = getRoute(pathname);
  const Page = route.Component;

  return (
    <MainLayout
      currentPath={pathname}
      navigationItems={gameNavigationItems}
    >
      <Page />
    </MainLayout>
  );
};
