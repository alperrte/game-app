/*
 * Token ve kullanıcı bilgisinin tarayıcı depolaması üzerinden yönetimi.
 *
 * "Beni hatırla" davranışı:
 *  - remember = true  -> localStorage   (tarayıcı kapansa da kalır)
 *  - remember = false -> sessionStorage (sekme kapanınca silinir)
 *
 * Okuma işlemleri her iki depolamaya da bakar; böylece hangi tercih yapılmışsa
 * uygulama yeniden yüklendiğinde token doğru yerden okunur.
 */

import { STORAGE_KEYS } from "./constants";
import type { AuthUser } from "../features/auth/types/auth.types";

/*
 * Token'ın hâlihazırda bulunduğu depolamayı verir.
 * Token yoksa varsayılan olarak localStorage döner.
 */
function activeStorage(): Storage {
    if (localStorage.getItem(STORAGE_KEYS.accessToken) !== null) {
        return localStorage;
    }
    if (sessionStorage.getItem(STORAGE_KEYS.accessToken) !== null) {
        return sessionStorage;
    }
    return localStorage;
}

export function getAccessToken(): string | null {
    return (
        localStorage.getItem(STORAGE_KEYS.accessToken) ??
        sessionStorage.getItem(STORAGE_KEYS.accessToken)
    );
}

export function getRefreshToken(): string | null {
    return (
        localStorage.getItem(STORAGE_KEYS.refreshToken) ??
        sessionStorage.getItem(STORAGE_KEYS.refreshToken)
    );
}

/*
 * Token'ları kaydeder.
 *
 * remember verilirse hedef depolama ona göre seçilir ve diğer depolamadaki
 * kopyalar temizlenir. remember verilmezse (örn. sessiz token yenileme)
 * mevcut aktif depolama korunur.
 */
export function setTokens(
    accessToken: string,
    refreshToken: string,
    remember?: boolean,
): void {
    const target =
        remember === undefined
            ? activeStorage()
            : remember
              ? localStorage
              : sessionStorage;

    const other = target === localStorage ? sessionStorage : localStorage;

    other.removeItem(STORAGE_KEYS.accessToken);
    other.removeItem(STORAGE_KEYS.refreshToken);
    other.removeItem(STORAGE_KEYS.user);

    target.setItem(STORAGE_KEYS.accessToken, accessToken);
    target.setItem(STORAGE_KEYS.refreshToken, refreshToken);
}

export function getStoredUser(): AuthUser | null {
    const raw =
        localStorage.getItem(STORAGE_KEYS.user) ??
        sessionStorage.getItem(STORAGE_KEYS.user);

    if (!raw) return null;

    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

/*
 * Kullanıcı bilgisini token'larla aynı depolamaya yazar.
 * (setTokens çağrıldıktan sonra çağrılmalıdır.)
 */
export function setStoredUser(user: AuthUser): void {
    activeStorage().setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

/*
 * Çıkışta tüm auth verisini her iki depolamadan da temizler.
 */
export function clearAuthStorage(): void {
    [localStorage, sessionStorage].forEach((storage) => {
        storage.removeItem(STORAGE_KEYS.accessToken);
        storage.removeItem(STORAGE_KEYS.refreshToken);
        storage.removeItem(STORAGE_KEYS.user);
        storage.removeItem(STORAGE_KEYS.profileReadyUserId);
    });
}

export function getProfileReadyUserId(): string | null {
    return (
        localStorage.getItem(STORAGE_KEYS.profileReadyUserId) ??
        sessionStorage.getItem(STORAGE_KEYS.profileReadyUserId)
    );
}

export function setProfileReady(userId: string): void {
    activeStorage().setItem(STORAGE_KEYS.profileReadyUserId, userId);
}

export function clearProfileReady(): void {
    [localStorage, sessionStorage].forEach((storage) => {
        storage.removeItem(STORAGE_KEYS.profileReadyUserId);
    });
}

export function isAuthenticated(): boolean {
    const token = getAccessToken();
    return Boolean(token) && !isTokenExpired(token);
}

/*
 * JWT'nin payload (orta) bölümünü güvenli şekilde decode eder.
 * Token bir JWT değilse veya bozuksa null döner.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const part = token.split(".")[1];
        if (!part) return null;

        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const padding = (4 - (base64.length % 4)) % 4;
        const padded = base64.padEnd(base64.length + padding, "=");

        const json = decodeURIComponent(
            atob(padded)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join(""),
        );

        const parsed: unknown = JSON.parse(json);
        return parsed && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

/*
 * Token'ın süresinin dolup dolmadığını JWT exp alanına göre döndürür.
 *
 * - token yoksa: süresi dolmuş kabul edilir (true).
 * - JWT değilse veya exp yoksa (örn. opaque refresh token): süresiz kabul edilir
 *   (false) — geçerliliği sunucu belirler.
 * - skewSeconds: saat farkı/gecikme payı (varsayılan 10sn).
 */
export function isTokenExpired(token: string | null, skewSeconds = 10): boolean {
    if (!token) return true;

    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;

    if (typeof exp !== "number") return false;

    return Date.now() >= (exp - skewSeconds) * 1000;
}
