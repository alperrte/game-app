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

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

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
    { headers: { "Content-Type": "application/json" } }
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
     * Login/register/refresh 401'leri olduğu gibi forma iletilir.
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
         */
        clearAuthStorage();

        if (window.location.pathname !== ROUTES.login) {
          window.location.href = ROUTES.login;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const cleanQueryParams = (query?: QueryParams) => {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
};

/*
 * Feature service dosyalarında sade kullanım için küçük apiClient wrapper'ı.
 * Altta yine merkezi axiosClient kullanılır; token ve refresh sistemi bozulmaz.
 */
export const apiClient = {
  get: async <TResponse>(endpoint: string, query?: QueryParams) => {
    const { data } = await axiosClient.get<TResponse>(endpoint, {
      params: cleanQueryParams(query),
    });

    return data;
  },

  post: async <TResponse, TBody = unknown>(endpoint: string, body: TBody) => {
    const { data } = await axiosClient.post<TResponse>(endpoint, body);
    return data;
  },

  put: async <TResponse, TBody = unknown>(endpoint: string, body: TBody) => {
    const { data } = await axiosClient.put<TResponse>(endpoint, body);
    return data;
  },

  delete: async (endpoint: string) => {
    await axiosClient.delete<void>(endpoint);
  },
};

export default axiosClient;