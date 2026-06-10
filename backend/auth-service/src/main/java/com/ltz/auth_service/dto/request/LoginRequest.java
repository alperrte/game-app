package com.ltz.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    /*
     * Kullanıcı login için email veya username girebilir.
     *
     * Örnek:
     * test@example.com
     * testuser
     */
    @NotBlank(message = "E-posta veya kullanıcı adı boş bırakılamaz.")
    private String identifier;

    /*
     * Kullanıcının düz şifresi.
     * BCrypt ile database'deki hash değerle karşılaştırılır.
     */
    @NotBlank(message = "Şifre boş bırakılamaz.")
    private String password;
}
