package com.ltz.auth_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ErrorResponse {

    /*
     * HTTP status code.
     *
     * Örnek:
     * 400, 401, 404, 409, 500
     */
    private int status;

    /*
     * Hata mesajı.
     */
    private String message;

    /*
     * Hatanın oluştuğu endpoint path bilgisi.
     */
    private String path;

    /*
     * Hatanın oluştuğu zaman.
     */
    private LocalDateTime timestamp;
}
