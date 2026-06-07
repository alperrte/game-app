package com.ltz.auth_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @Email(message = "Email formatı geçerli olmalıdır.")
    @NotBlank(message = "Email boş olamaz.")
    private String email;

    @NotBlank(message = "Şifre boş olamaz.")
    private String password;
}