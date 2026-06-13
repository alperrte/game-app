package com.ltz.auth_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    /*
     * Kullanıcının e-posta adresi.
     * Boş olamaz ve geçerli e-posta formatında olmalıdır.
     */
    @NotBlank(message = "E-posta alanı boş bırakılamaz.")
    @Email(message = "Geçerli bir e-posta adresi giriniz.")
    @Size(max = 150, message = "E-posta en fazla 150 karakter olabilir.")
    private String email;

    /*
     * Kullanıcı adı.
     * Boş olamaz.
     * En az 3, en fazla 100 karakter olmalıdır.
     */
    @NotBlank(message = "Kullanıcı adı boş bırakılamaz.")
    @Size(min = 3, max = 100, message = "Kullanıcı adı 3 ile 100 karakter arasında olmalıdır.")
    private String username;

    /*
     * Kullanıcının düz şifresi.
     * Database'e bu haliyle kaydedilmez.
     * Service katmanında BCrypt ile hashlenir.
     */
    @NotBlank(message = "Şifre boş bırakılamaz.")
    @Size(min = 6, max = 100, message = "Şifre 6 ile 100 karakter arasında olmalıdır.")
    private String password;
}
