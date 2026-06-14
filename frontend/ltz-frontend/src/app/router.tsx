/*
 * Uygulamanın merkezi route tanımları.
 *
 * - Public: /login (MainLayout dışında)
 * - Private: MainLayout içinde açılan, giriş gerektiren sayfalar
 *
 * Giriş kontrolü authStore üzerinden yapılır.
 */

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { MainLayout } from "./MainLayout";
import { AuthLayout } from "./AuthLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { OAuthCallbackPage } from "../features/auth/pages/OAuthCallbackPage";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/constants";

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
 * Giriş yapılmışsa login sayfasını atlatıp ana uygulamaya yönlendirir.
 */
function PublicOnlyRoute() {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to={ROUTES.home} replace />;
    }

    return <Outlet />;
}

/*
 * Giriş sonrası geçici ana sayfa placeholder'ı.
 * (Asıl ana sayfa bu görevin kapsamı dışındadır.)
 */
function HomePlaceholder() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
                Lobiye hoş geldin{user ? `, ${user.username}` : ""}!
            </h1>
            <p className="text-zinc-400">
                Giriş başarılı. Ana uygulama ekranları yakında burada olacak.
            </p>
        </div>
    );
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
                    <Route path={ROUTES.home} element={<HomePlaceholder />} />
                </Route>
            </Route>

            {/* Bilinmeyen yollar ana sayfaya */}
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
    );
}
