package com.ltz.auth_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    /*
     * Kısa süreli JWT access token.
     */
    private String accessToken;

    /*
     * Uzun süreli refresh token.
     */
    private String refreshToken;

    /*
     * Token tipi.
     * Genelde Bearer kullanılır.
     */
    private String tokenType;

    /*
     * Kullanıcının auth-service içindeki id değeri.
     */
    private Long userId;

    /*
     * Kullanıcının e-posta adresi.
     */
    private String email;

    /*
     * Kullanıcının kullanıcı adı.
     */
    private String username;

    /*
     * Kullanıcının rol adı.
     *
     * Örnek:
     * USER, ADMIN
     */
    private String role;
}
