import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { MainLayout } from "./MainLayout";
import { AuthLayout } from "./AuthLayout";

import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { OAuthCallbackPage } from "../features/auth/pages/OAuthCallbackPage";

import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/constants";

import GamesPage from "../features/game/pages/GamesPage";
import GameCreatePage from "../features/game/pages/GameCreatePage";
import GameDetailPage from "../features/game/pages/GameDetailPage";
import GameEditPage from "../features/game/pages/GameEditPage";
import GameCategoriesPage from "../features/game/pages/GameCategoriesPage";
import GamePlatformsPage from "../features/game/pages/GamePlatformsPage";
import GameDevelopersPage from "../features/game/pages/GameDevelopersPage";
import GamePublishersPage from "../features/game/pages/GamePublishersPage";
import GameSystemRequirementsPage from "../features/game/pages/GameSystemRequirementsPage";

const GAME_ROUTES = {
  games: "/games",
  createGame: "/games/create",
  categories: "/games/categories",
  platforms: "/games/platforms",
  developers: "/games/developers",
  publishers: "/games/publishers",
  systemRequirements: "/games/system-requirements",
  externalGameDetail: "/games/external/:source/:externalId",
};

/*
 * Giriş yapılmamışsa login sayfasına yönlendiren koruma.
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}

/*
 * Giriş yapılmışsa login/register sayfalarını atlatıp ana uygulamaya yönlendirir.
 */
function PublicOnlyRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={GAME_ROUTES.games} replace />;
  }

  return <Outlet />;
}

/*
 * Giriş sonrası geçici ana sayfa yönlendirmesi.
 */
function HomeRedirect() {
  return <Navigate to={GAME_ROUTES.games} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public: yalnızca giriş yapılmamışken erişilebilir */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
        </Route>
      </Route>

      {/* OAuth dönüşü: oturumu kendisi başlatır, bu yüzden guard'sızdır */}
      <Route path={ROUTES.oauthCallback} element={<OAuthCallbackPage />} />

      {/* Private: MainLayout içinde, giriş gerektirir */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.home} element={<HomeRedirect />} />

          <Route path={GAME_ROUTES.games} element={<GamesPage />} />
          <Route path={GAME_ROUTES.createGame} element={<GameCreatePage />} />

          <Route
            path={GAME_ROUTES.categories}
            element={<GameCategoriesPage />}
          />
          <Route
            path={GAME_ROUTES.platforms}
            element={<GamePlatformsPage />}
          />
          <Route
            path={GAME_ROUTES.developers}
            element={<GameDevelopersPage />}
          />
          <Route
            path={GAME_ROUTES.publishers}
            element={<GamePublishersPage />}
          />
          <Route
            path={GAME_ROUTES.systemRequirements}
            element={<GameSystemRequirementsPage />}
          />
          <Route
            path={GAME_ROUTES.externalGameDetail}
            element={<GameDetailPage />}
          />

          <Route path="/games/:id/edit" element={<GameEditPage />} />
        </Route>
      </Route>

      {/* Bilinmeyen yollar oyun listeleme sayfasına */}
      <Route path="*" element={<Navigate to={GAME_ROUTES.games} replace />} />
    </Routes>
  );
}
