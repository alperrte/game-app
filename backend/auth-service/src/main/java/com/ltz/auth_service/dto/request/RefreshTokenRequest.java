package com.ltz.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshTokenRequest {

    /*
     * Kullanıcının refresh token değeri.
     * Access token süresi dolduğunda yeni access token almak için kullanılır.
     */
    @NotBlank(message = "Refresh token boş bırakılamaz.")
    private String refreshToken;
}
