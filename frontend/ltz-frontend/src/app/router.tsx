import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { MainLayout } from "./MainLayout";
import { AuthLayout } from "./AuthLayout";

import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { OAuthCallbackPage } from "../features/auth/pages/OAuthCallbackPage";

import { useAuthStore } from "../store/authStore";
import { GAME_ROUTES, ROUTES, SOCIAL_ROUTES } from "../lib/constants";
import { ProfilePage } from "../features/user/pages/ProfilePage";

import GamesPage from "../features/game/pages/GamesPage";
import GameCreatePage from "../features/game/pages/GameCreatePage";
import GameDetailPage from "../features/game/pages/GameDetailPage";
import GameEditPage from "../features/game/pages/GameEditPage";
import GameCategoriesPage from "../features/game/pages/GameCategoriesPage";
import GamePlatformsPage from "../features/game/pages/GamePlatformsPage";
import GameDevelopersPage from "../features/game/pages/GameDevelopersPage";
import GamePublishersPage from "../features/game/pages/GamePublishersPage";
import GameSystemRequirementsPage from "../features/game/pages/GameSystemRequirementsPage";

import SocialFeedPage from "../features/social/pages/SocialFeedPage";
import MessagesPage from "../features/social/pages/MessagesPage";

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
 * Giriş yapılmışsa login/register sayfalarını atlatıp
 * ana uygulamaya yönlendirir.
 */
function PublicOnlyRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={SOCIAL_ROUTES.feed} replace />;
  }

  return <Outlet />;
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

      {/* OAuth dönüşü oturumu kendisi başlatır; guard kullanılmaz */}
      <Route
        path={ROUTES.oauthCallback}
        element={<OAuthCallbackPage />}
      />

      {/* Private: giriş gerektiren sayfalar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Sosyal medya */}
          <Route
            path={ROUTES.home}
            element={<SocialFeedPage />}
          />

          <Route
            path={SOCIAL_ROUTES.messages}
            element={<MessagesPage />}
          />

          <Route
            path={SOCIAL_ROUTES.chatRoom(":roomId")}
            element={<MessagesPage />}
          />

          {/* Oyun listeleme ve oluşturma */}
          <Route
            path={GAME_ROUTES.games}
            element={<GamesPage />}
          />

          <Route
            path={GAME_ROUTES.createGame}
            element={<GameCreatePage />}
          />

          {/* Oyun servisinin alt sayfaları */}
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

          {/*
           * External route dinamik /games/:id route'undan önce tanımlanır.
           * Böylece "external", oyun ID'si olarak değerlendirilmez.
           */}
          <Route
            path={GAME_ROUTES.externalGameDetail(
              ":source",
              ":externalId",
            )}
            element={<GameDetailPage />}
          />

          {/* Düzenleme route'u detay route'undan önce tutulur */}
          <Route
            path={GAME_ROUTES.editGame(":id")}
            element={<GameEditPage />}
          />

          <Route
            path={GAME_ROUTES.gameDetail(":id")}
            element={<GameDetailPage />}
          />

          {/* Kullanıcı profili */}
          <Route
            path={ROUTES.profile}
            element={<ProfilePage />}
          />
        </Route>
      </Route>

      {/* Bilinmeyen yollar sosyal akış sayfasına yönlendirilir */}
      <Route
        path="*"
        element={<Navigate to={SOCIAL_ROUTES.feed} replace />}
      />
    </Routes>
  );
}

