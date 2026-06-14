package com.ltz.auth_service.exception;

/*
 * Harici sağlayıcı (STEAM) doğrulaması başarısız olduğunda fırlatılır.
 *
 * Örnek:
 * - Steam OpenID check_authentication yanıtı geçersiz
 */
public class OAuthAuthenticationException extends RuntimeException {

    public OAuthAuthenticationException(String message) {
        super(message);
    }
}
