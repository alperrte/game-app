/*
 * OAuth (Steam) dönüş sayfası.
 *
 * Backend, başarılı OAuth girişinden sonra tarayıcıyı şu adrese yönlendirir:
 *   /oauth/callback?accessToken=...&refreshToken=...
 *
 * Bu sayfa:
 *  1) Token'ları query'den okur,
 *  2) validate-token ile kullanıcı bilgisini çözer,
 *  3) oturumu başlatır (store + depolama) ve ana sayfaya yönlendirir.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Card } from "../../../components/ui/Card";
import { ROUTES } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { setAuthFromResponse } from "../../../store/authStore";
import { authService } from "../services/authService";
import { AuthBackdrop } from "../components/AuthBackdrop";

export function OAuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [asyncError, setAsyncError] = useState<string | null>(null);

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const providerError = searchParams.get("error");
    const missingTokens = !providerError && (!accessToken || !refreshToken);

    /*
     * StrictMode altında effect iki kez çalışabileceği için tek seferlik koruma.
     */
    const handledRef = useRef(false);

    useEffect(() => {
        if (
            providerError ||
            !accessToken ||
            !refreshToken ||
            handledRef.current
        ) {
            return;
        }
        handledRef.current = true;

        async function completeLogin(access: string, refresh: string) {
            try {
                const validation = await authService.validateToken(access);

                if (!validation.valid) {
                    setAsyncError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
                    return;
                }

                // OAuth oturumu kalıcıdır (remember = true varsayılan).
                setAuthFromResponse({
                    accessToken: access,
                    refreshToken: refresh,
                    tokenType: "Bearer",
                    userId: validation.userId,
                    email: validation.email,
                    username: validation.username,
                    role: validation.role,
                });

                navigate(ROUTES.home, { replace: true });
            } catch (err) {
                setAsyncError(getErrorMessage(err, "Giriş tamamlanamadı."));
            }
        }

        void completeLogin(accessToken, refreshToken);
    }, [navigate, accessToken, refreshToken, providerError]);

    /*
     * Eksik token hatası render sırasında türetilir (effect içinde setState yok).
     */
    const error =
        providerError ??
        (missingTokens
            ? "Giriş bilgisi alınamadı. Lütfen tekrar deneyin."
            : asyncError);

    return (
        <AuthBackdrop>
            <div className="flex min-h-screen items-center justify-center px-6">
                <Card className="w-full max-w-md p-9 text-center">
                    {error ? (
                        <>
                            <h1 className="text-xl font-bold text-white">Giriş başarısız</h1>
                            <p className="mt-2 text-sm text-zinc-400">{error}</p>
                            <button
                                type="button"
                                onClick={() => navigate(ROUTES.login, { replace: true })}
                                className="mt-6 font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                            >
                                Giriş sayfasına dön
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-fuchsia-400" />
                            <h1 className="mt-5 text-lg font-semibold text-white">
                                Giriş yapılıyor...
                            </h1>
                            <p className="mt-1 text-sm text-zinc-400">
                                Lobine yönlendiriliyorsun.
                            </p>
                        </>
                    )}
                </Card>
            </div>
        </AuthBackdrop>
    );
}
