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
    getStoredUser,
    setStoredUser,
    setTokens,
} from "../lib/token";

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
}

type Listener = () => void;

let state: AuthState = {
    user: getStoredUser(),
    isAuthenticated: Boolean(getStoredUser()),
};

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
 * Componentlerin auth durumuna abone olmasını sağlayan hook.
 */
export function useAuthStore(): AuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
