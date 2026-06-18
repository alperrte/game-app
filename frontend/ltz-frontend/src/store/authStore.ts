/*
 * Uygulama genelinde paylaşılan auth state'i.
 *
 * Harici bir state kütüphanesi (zustand vb.) kullanılmadan, React'in yerleşik
 * useSyncExternalStore API'si ile küçük bir pub-sub store olarak kurulmuştur.
 * Kalıcı veri localStorage'da (token.ts) tutulur; bu store canlı React durumudur.
 */

import { useSyncExternalStore } from "react";
import type { AuthResponse, AuthUser } from "../features/auth/types/auth.types";
import { STORAGE_KEYS } from "../lib/constants";
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    getStoredUser,
    isTokenExpired,
    setStoredUser,
    setTokens,
} from "../lib/token";
import { authService } from "../features/auth/services/authService";

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
}

type Listener = () => void;

function readAuthState(): AuthState {
    const token = getAccessToken();
    const user = token ? getStoredUser() : null;

    return {
        user,
        isAuthenticated: Boolean(token),
    };
}

let state: AuthState = readAuthState();

const listeners = new Set<Listener>();

function cacheUserIdentity(user: AuthUser): void {
    try {
        const rawValue = localStorage.getItem(STORAGE_KEYS.userIdentityCache);
        const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : {};
        const nextValue: Record<string, string> =
            parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
                ? { ...parsedValue }
                : {};

        nextValue[String(user.userId)] = user.username;
        localStorage.setItem(STORAGE_KEYS.userIdentityCache, JSON.stringify(nextValue));
    } catch {
        // localStorage kullanılamıyorsa auth akışını bozma.
    }
}

function emit(): void {
    listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): AuthState {
    return state;
}

/*
 * Başarılı login / register / OAuth sonrası çağrılır.
 * Token'ları ve kullanıcı bilgisini kaydeder, store'u günceller.
 *
 * remember: "Beni hatırla" tercihi (true -> localStorage, false -> sessionStorage).
 * Varsayılan true'dur (register ve OAuth akışları kalıcı oturum kullanır).
 */
export function setAuthFromResponse(
    response: AuthResponse,
    remember = true,
): void {
    const user: AuthUser = {
        userId: response.userId,
        email: response.email,
        username: response.username,
        role: response.role,
    };

    setTokens(response.accessToken, response.refreshToken, remember);
    setStoredUser(user);
    cacheUserIdentity(user);

    state = { user, isAuthenticated: true };
    emit();
}

/*
 * Oturumu temizler (logout).
 */
export function clearAuth(): void {
    clearAuthStorage();
    state = { user: null, isAuthenticated: false };
    emit();
}

/*
 * Uygulama açılışında bir kez çağrılır.
 *
 * Storage'da oturum varmış gibi görünse bile (user objesi mevcut), access token'ın
 * JWT exp'i kontrol edilir:
 *  - Token geçerliyse dokunulmaz.
 *  - Token süresi dolmuşsa ve geçerli bir refresh token varsa sessizce yenilenir;
 *    yenileme aynı depolamada (localStorage/sessionStorage) kalır.
 *  - Yenileme yoksa/başarısızsa oturum tamamen temizlenir ve kullanıcı login'e düşer.
 *
 * Böylece süresi dolmuş token ile "son sayfa" açık kalmaz.
 */
export async function bootstrapAuth(): Promise<void> {
    const user = getStoredUser();
    const accessToken = getAccessToken();

    if (!user || !accessToken) {
        if (state.isAuthenticated) clearAuth();
        return;
    }

    if (!isTokenExpired(accessToken)) {
        return;
    }

    const refreshToken = getRefreshToken();

    if (refreshToken) {
        try {
            const response = await authService.refreshToken({ refreshToken });

            // Token rotation: sunucu yeni bir refresh token döner; storage tercihini koruyarak güncelle.
            setTokens(response.accessToken, response.refreshToken);

            // Kullanıcı bilgisini (rol değişikliği vb.) ve store state'ini de yenile.
            const updatedUser: AuthUser = {
                userId: response.userId,
                email: response.email,
                username: response.username,
                role: response.role,
            };
            setStoredUser(updatedUser);
            state = { user: updatedUser, isAuthenticated: true };
            emit();
            return;
        } catch {
            // Yenileme başarısız: aşağıda oturumu temizle.
        }
    }

    clearAuth();
}

/*
 * Componentlerin auth durumuna abone olmasını sağlayan hook.
 */
export function useAuthStore(): AuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
