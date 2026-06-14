/*
 * Uygulama genelinde değişmeyen sabit değerler.
 * Route adresleri, localStorage key değerleri ve auth endpoint path'leri burada tutulur.
 */

export const APP_NAME = "LobbyTwoZero";
export const APP_SHORT_NAME = "LTZ";

/*
 * API Gateway base URL.
 * Frontend tüm isteklerini bu adres üzerinden gönderir.
 * Değer .env içindeki VITE_API_BASE_URL'den gelir.
 */
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7070";

/*
 * Auth-service endpoint path'leri (Gateway üzerinden).
 */
export const AUTH_ENDPOINTS = {
    login: "/api/auth/login",
    register: "/api/auth/register",
    refreshToken: "/api/auth/refresh-token",
    logout: "/api/auth/logout",
    validateToken: "/api/auth/validate-token",
} as const;

/*
 * Uygulama route adresleri.
 */
export const ROUTES = {
    login: "/login",
    register: "/register",
    oauthCallback: "/oauth/callback",
    home: "/",
} as const;

/*
 * Form doğrulama kuralları (backend RegisterRequest ile uyumlu).
 */
export const VALIDATION = {
    passwordMin: 6,
    passwordMax: 100,
    usernameMin: 3,
    usernameMax: 100,
    emailMax: 150,
} as const;

/*
 * localStorage key değerleri.
 */
export const STORAGE_KEYS = {
    accessToken: "ltz_access_token",
    refreshToken: "ltz_refresh_token",
    user: "ltz_user",
} as const;

/*
 * Kullanıcı rolleri.
 */
export const ROLES = {
    user: "USER",
    admin: "ADMIN",
} as const;
