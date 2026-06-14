/*
 * Merkezi axios istemcisi.
 * Frontend tüm backend isteklerini yalnızca API Gateway üzerinden gönderir.
 *
 * - Request interceptor: varsa access token'ı Authorization header'a ekler.
 * - Response interceptor: 401 alındığında bir kez refresh-token ile yeni access token
 *   alıp isteği tekrar dener. Refresh başarısızsa oturum temizlenir ve login'e yönlenir.
 */

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, AUTH_ENDPOINTS, ROUTES } from "./constants";
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    setTokens,
} from "./token";
import type { AuthResponse } from "../features/auth/types/auth.types";

export const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/*
 * Aynı anda birden fazla 401 gelirse tek bir refresh isteği yapılması için kilit.
 * Bekleyen istekler aynı refresh sonucunu paylaşır (single-flight).
 */
let refreshPromise: Promise<string> | null = null;

/*
 * refresh-token isteğini axiosClient DIŞINDA, ham axios ile yapar.
 * Böylece interceptor'a yeniden girip sonsuz döngü oluşmaz.
 */
async function requestNewAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error("Refresh token bulunamadı.");
    }

    const { data } = await axios.post<AuthResponse>(
        `${API_BASE_URL}${AUTH_ENDPOINTS.refreshToken}`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
    );

    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
}

function isAuthEndpoint(url?: string): boolean {
    if (!url) return false;
    return (
        url.includes(AUTH_ENDPOINTS.login) ||
        url.includes(AUTH_ENDPOINTS.register) ||
        url.includes(AUTH_ENDPOINTS.refreshToken)
    );
}

axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;

        const status = error.response?.status;

        /*
         * Sadece 401 + daha önce denenmemiş + auth endpoint'i olmayan istekleri yenile.
         * Login/register/refresh 401'leri (hatalı şifre vb.) olduğu gibi forma iletilir.
         */
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthEndpoint(originalRequest.url) &&
            getRefreshToken()
        ) {
            originalRequest._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = requestNewAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const newToken = await refreshPromise;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                /*
                 * Refresh başarısız: oturumu temizle ve login'e yönlendir.
                 * (Döngüsel import olmaması için store yerine doğrudan storage temizlenir
                 *  ve hard redirect yapılır.)
                 */
                clearAuthStorage();
                if (window.location.pathname !== ROUTES.login) {
                    window.location.href = ROUTES.login;
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
