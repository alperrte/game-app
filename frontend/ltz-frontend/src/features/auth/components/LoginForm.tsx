/*
 * Login form paneli.
 *
 * - Logo + başlık + açıklama
 * - E-posta (identifier) ve şifre inputları
 * - Beni hatırla + şifremi unuttum
 * - Ana CTA: Giriş Yap
 * - Steam OAuth + register linki
 *
 * Auth akışı: form -> authService.login() -> setAuthFromResponse() -> ana sayfaya yönlendirme.
 * Component içinde doğrudan axios çağrısı YAPILMAZ; istek service katmanından geçer.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, User } from "lucide-react";

import ltzLogo from "../../../assets/ltz-yazi.png";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { API_BASE_URL, ROUTES } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { validateLoginForm } from "../../../utils/validation";
import type { LoginFormErrors } from "../../../utils/validation";
import { setAuthFromResponse } from "../../../store/authStore";
import { authService } from "../services/authService";
import { SocialLoginButton } from "./SocialLoginButton";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { SteamIcon } from "./BrandIcons";

export function LoginForm() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});

    /*
     * Steam ile giriş: tarayıcıyı API Gateway üzerinden Steam OAuth ucuna yönlendirir.
     * Backend doğrulama sonrası /oauth/callback'e token'larla geri döner.
     */
    function startSteamLogin() {
        window.location.href = `${API_BASE_URL}/api/auth/steam`;
    }

    function goToRegister() {
        navigate(ROUTES.register);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const errors = validateLoginForm({ identifier, password });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login({
                identifier: identifier.trim(),
                password,
            });

            setAuthFromResponse(response, rememberMe);
            navigate(ROUTES.home, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, "Giriş yapılamadı. Bilgilerinizi kontrol edin."));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-form w-full">
            {/* Logo */}
            <div className="mb-4 flex justify-center">
                <img
                    src={ltzLogo}
                    alt="LobbyTwoZero"
                    className="h-24 max-w-full object-contain drop-shadow-[0_0_28px_rgba(125,68,255,0.6)]"
                />
            </div>

            {/* Başlık */}
            <div className="mb-5 text-center">
                <h1 className="text-2xl font-semibold text-white">Hoşgeldin Oyuncu</h1>
                <p className="mt-1 text-xs text-zinc-500">
                    Lobine devam etmek için giriş yap.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    label="E-posta veya Kullanıcı Adı"
                    type="text"
                    placeholder="E-posta veya kullanıcı adınız"
                    autoComplete="username"
                    icon={<User size={18} />}
                    className="login-form-input"
                    value={identifier}
                    onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (fieldErrors.identifier)
                            setFieldErrors((p) => ({ ...p, identifier: undefined }));
                    }}
                    error={fieldErrors.identifier}
                    required
                />

                <Input
                    label="Şifre"
                    isPassword
                    placeholder="Şifrenizi girin"
                    autoComplete="current-password"
                    icon={<Lock size={18} />}
                    className="login-form-input"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password)
                            setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    error={fieldErrors.password}
                    required
                />

                {/* Beni hatırla + şifremi unuttum */}
                <div className="flex items-center justify-between text-xs">
                    <label className="login-remember-control flex cursor-pointer select-none items-center gap-2 text-zinc-400">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="login-remember h-4 w-4"
                        />
                        Beni hatırla
                    </label>

                    <button
                        type="button"
                        className="text-fuchsia-400 transition-colors hover:text-fuchsia-300"
                        // TODO: Şifre sıfırlama akışı/endpoint'i yok; şimdilik UI-only.
                    >
                        Şifremi unuttum
                    </button>
                </div>

                {/* Hata mesajı */}
                {error && (
                    <p
                        role="alert"
                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
                    >
                        {error}
                    </p>
                )}

                {/* Ana CTA */}
                <Button
                    type="submit"
                    variant="primary"
                    className="login-submit w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={18} />}
                >
                    Giriş Yap
                </Button>
            </form>

            {/* Ayırıcı */}
            <div className="my-4 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-zinc-600">veya</span>
                <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Sosyal giriş */}
            <div className="space-y-3">
                <SocialLoginButton
                    icon={<SteamIcon size={18} />}
                    label="Steam ile Giriş Yap"
                    className="login-social"
                    onClick={startSteamLogin}
                />
            </div>

            {/* Register linki */}
            <p className="mt-5 text-center text-sm text-zinc-500">
                Hesabın yok mu?{" "}
                <button
                    type="button"
                    onClick={goToRegister}
                    className="font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                >
                    Hemen oluştur
                </button>
            </p>

            {/* Sosyal medya takip linkleri (OAuth değil) */}
            <SocialMediaLinks />
        </div>
    );
}
