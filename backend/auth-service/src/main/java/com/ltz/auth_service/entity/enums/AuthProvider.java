package com.ltz.auth_service.entity.enums;

/*
 * Kullanıcının kimlik doğrulama sağlayıcısı.
 *
 * LOCAL : E-posta/kullanıcı adı + şifre ile kayıt olan yerel kullanıcı.
 * STEAM : Steam OpenID ile giriş yapan kullanıcı (şifresiz).
 */
public enum AuthProvider {
    LOCAL,
    STEAM
}
