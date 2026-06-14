/*
 * Auth-service ile birebir uyumlu request / response tipleri.
 * Alan adları backend DTO'larından alınmıştır, değiştirilmemelidir.
 */

/*
 * POST /api/auth/login
 * identifier alanı email VEYA username olabilir.
 */
export interface LoginRequest {
    identifier: string;
    password: string;
}

/*
 * POST /api/auth/register
 */
export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}

/*
 * POST /api/auth/refresh-token
 * POST /api/auth/logout
 */
export interface RefreshTokenRequest {
    refreshToken: string;
}

/*
 * Login / register / refresh-token endpointlerinin ortak yanıtı.
 * Backend: AuthResponse
 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    userId: number;
    email: string;
    username: string;
    role: string;
}

/*
 * GET /api/auth/validate-token
 * Backend: TokenValidationResponse
 */
export interface TokenValidationResponse {
    valid: boolean;
    userId: number;
    email: string;
    username: string;
    role: string;
    message: string;
}

/*
 * Basit mesaj yanıtı (logout vb.).
 * Backend: MessageResponse
 */
export interface MessageResponse {
    message: string;
}

/*
 * Store / UI tarafında tutulan kullanıcı modeli.
 * AuthResponse içinden token'lar hariç kullanıcı bilgisi.
 */
export interface AuthUser {
    userId: number;
    email: string;
    username: string;
    role: string;
}
