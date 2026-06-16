/*
 * Register (kayıt) form paneli.
 *
 * - Logo + başlık + açıklama
 * - E-posta, kullanıcı adı, şifre, şifre tekrar inputları
 * - İstemci tarafı validasyon (utils/validation)
 * - Ana CTA: Hesap Oluştur
 *
 * Auth akışı: form -> authService.register() -> setAuthFromResponse() -> ana sayfaya yönlendirme.
 * Backend register başarılı yanıtta da AuthResponse (token'lar) döndürdüğü için kullanıcı
 * kayıt sonrası otomatik giriş yapmış olur.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AtSign, Lock, Mail } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import ltzLogo from "../../../assets/ltz-yazi.png";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { API_BASE_URL, ROUTES } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { validateRegisterForm } from "../../../utils/validation";
import type { RegisterFormErrors } from "../../../utils/validation";
import { setAuthFromResponse } from "../../../store/authStore";
import { authService } from "../services/authService";
import { SocialLoginButton } from "./SocialLoginButton";
import { SteamIcon } from "./BrandIcons";

export function RegisterForm() {
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});

    function clearFieldError(field: keyof RegisterFormErrors) {
        setFieldErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );
    }

    function goToLogin() {
        navigate(ROUTES.login);
    }

    /*
     * Steam ile kayıt/giriş: OAuth ucuna yönlendirir (kullanıcı yoksa otomatik oluşturulur).
     */
    function startSteamLogin() {
        window.location.href = `${API_BASE_URL}/api/auth/steam`;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const errors = validateRegisterForm({
            email,
            username,
            password,
            confirmPassword,
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register({
                email: email.trim(),
                username: username.trim(),
                password,
            });

            setAuthFromResponse(response);
            navigate(ROUTES.home, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, "Kayıt oluşturulamadı. Lütfen tekrar deneyin."));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-form w-full">
            <div className="auth-logo-shell mb-3 flex justify-center">
                <motion.img
                    src={ltzLogo}
                    alt="LobbyTwoZero"
                    className="auth-logo h-20 max-w-full object-contain"
                    initial={
                        shouldReduceMotion
                            ? false
                            : { opacity: 0, scale: 0.92, y: -6 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        delay: 0.08,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                />
            </div>

            <motion.div
                className="auth-heading mb-5 text-center"
                initial={
                    shouldReduceMotion ? false : { opacity: 0, y: 8 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.18,
                    duration: 0.46,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <span className="auth-access-badge">YENİ OYUNCU</span>
                <h1 className="auth-title mt-2 text-3xl font-bold tracking-tight">
                    Lobine katıl!
                </h1>
                <p className="auth-subtitle mt-2 inline-flex items-center gap-2 text-xs">
                    <span className="auth-subtitle-pulse" aria-hidden="true" />
                    Hesabını oluştur ve oyuna başla.
                </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    label="E-posta"
                    type="email"
                    placeholder="ornek@lobbytwozero.com"
                    autoComplete="email"
                    icon={<Mail size={18} />}
                    className="login-form-input"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                    }}
                    error={fieldErrors.email}
                    required
                />

                <Input
                    label="Kullanıcı adı"
                    placeholder="oyuncu_adi"
                    autoComplete="username"
                    icon={<AtSign size={18} />}
                    className="login-form-input"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        clearFieldError("username");
                    }}
                    error={fieldErrors.username}
                    required
                />

                <Input
                    label="Şifre"
                    isPassword
                    placeholder="En az 6 karakter"
                    autoComplete="new-password"
                    icon={<Lock size={18} />}
                    className="login-form-input"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                    }}
                    error={fieldErrors.password}
                    required
                />

                <Input
                    label="Şifre (tekrar)"
                    isPassword
                    placeholder="Şifreni tekrar gir"
                    autoComplete="new-password"
                    icon={<Lock size={18} />}
                    className="login-form-input"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError("confirmPassword");
                    }}
                    error={fieldErrors.confirmPassword}
                    required
                />

                <AnimatePresence initial={false}>
                    {error && (
                        <motion.p
                            role="alert"
                            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: -6 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <Button
                    type="submit"
                    variant="primary"
                    className="login-submit w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={18} />}
                >
                    Hesap Oluştur
                </Button>
            </form>

            {/* Ayırıcı */}
            <div className="my-4 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-zinc-600">veya</span>
                <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Sosyal kayıt (yalnızca Steam) */}
            <SocialLoginButton
                icon={<SteamIcon size={18} />}
                label="Steam ile Kayıt Ol"
                className="login-social"
                onClick={startSteamLogin}
            />

            <p className="mt-5 text-center text-sm text-zinc-500">
                Zaten hesabın var mı?{" "}
                <button
                    type="button"
                    onClick={goToLogin}
                    className="font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                >
                    Giriş yap
                </button>
            </p>
        </div>
    );
}
