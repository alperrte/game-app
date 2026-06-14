/*
 * MainLayout: Login / register dışındaki ana uygulama ekranlarının ortak kabuğu.
 * Giriş sonrası sayfalar bu layout içindeki <Outlet /> alanında açılır.
 *
 * Üstte minimal bir bar (logo + kullanıcı + çıkış) bulunur.
 * Navbar/Sidebar gibi zengin yapılar bu görevin kapsamı dışındadır.
 */

import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "../components/ui/Button";
import { APP_NAME, ROUTES } from "../lib/constants";
import { getRefreshToken } from "../lib/token";
import { clearAuth, useAuthStore } from "../store/authStore";
import { authService } from "../features/auth/services/authService";

export function MainLayout() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);

        const refreshToken = getRefreshToken();

        try {
            /*
             * Refresh token'ı backend'de iptal et. Hata olsa bile (token süresi dolmuş vb.)
             * istemci tarafında oturumu yine de temizleriz.
             */
            if (refreshToken) {
                await authService.logout({ refreshToken });
            }
        } catch {
            /* logout hatası kullanıcıyı engellememeli */
        } finally {
            clearAuth();
            navigate(ROUTES.login, { replace: true });
        }
    }

    return (
        <div className="min-h-screen bg-ltz-bg text-white">
            <header className="border-b border-white/10 bg-ltz-panel/60 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <span className="text-sm font-bold tracking-widest text-fuchsia-300">
                        {APP_NAME}
                    </span>

                    <div className="flex items-center gap-3">
                        {user && (
                            <span className="text-sm text-zinc-300">
                                {user.username}
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-9 px-3 text-xs"
                            isLoading={isLoggingOut}
                            leftIcon={<LogOut size={15} />}
                            onClick={handleLogout}
                        >
                            Çıkış
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}
