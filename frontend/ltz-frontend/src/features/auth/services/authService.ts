/*
 * Auth-service ile iletişim kuran servis katmanı.
 * Componentler doğrudan axios çağırmaz; tüm auth istekleri buradan geçer.
 * İstekler axiosClient (API Gateway) üzerinden gider.
 */

import axiosClient from "../../../lib/axios";
import { AUTH_ENDPOINTS } from "../../../lib/constants";
import type {
    AuthResponse,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenValidationResponse,
} from "../types/auth.types";

export const authService = {
    /*
     * POST /api/auth/login
     * identifier: email veya username.
     */
    async login(payload: LoginRequest): Promise<AuthResponse> {
        const { data } = await axiosClient.post<AuthResponse>(
            AUTH_ENDPOINTS.login,
            payload,
        );
        return data;
    },

    /*
     * POST /api/auth/register
     * (Register sayfası henüz yok; servis ileride kullanılmak üzere hazır.)
     */
    async register(payload: RegisterRequest): Promise<AuthResponse> {
        const { data } = await axiosClient.post<AuthResponse>(
            AUTH_ENDPOINTS.register,
            payload,
        );
        return data;
    },

    /*
     * POST /api/auth/refresh-token
     */
    async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponse> {
        const { data } = await axiosClient.post<AuthResponse>(
            AUTH_ENDPOINTS.refreshToken,
            payload,
        );
        return data;
    },

    /*
     * POST /api/auth/logout
     */
    async logout(payload: RefreshTokenRequest): Promise<MessageResponse> {
        const { data } = await axiosClient.post<MessageResponse>(
            AUTH_ENDPOINTS.logout,
            payload,
        );
        return data;
    },

    /*
     * GET /api/auth/validate-token?token=...
     * Token geçerliyse içindeki kullanıcı bilgisini döndürür.
     * OAuth dönüşünde, URL'den gelen access token ile kullanıcıyı çözmek için kullanılır.
     */
    async validateToken(token: string): Promise<TokenValidationResponse> {
        const { data } = await axiosClient.get<TokenValidationResponse>(
            AUTH_ENDPOINTS.validateToken,
            { params: { token } },
        );
        return data;
    },
};
