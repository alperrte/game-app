package com.ltz.auth_service.exception;

/*
 * Harici sağlayıcı (STEAM/DISCORD) doğrulaması başarısız olduğunda fırlatılır.
 *
 * Örnek:
 * - Steam OpenID check_authentication yanıtı geçersiz
 * - Discord token exchange başarısız
 */
public class OAuthAuthenticationException extends RuntimeException {

    public OAuthAuthenticationException(String message) {
        super(message);
    }
}
