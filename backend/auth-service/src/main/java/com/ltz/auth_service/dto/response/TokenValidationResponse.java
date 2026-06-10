package com.ltz.auth_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenValidationResponse {

    /*
     * Token geçerli mi?
     */
    private boolean valid;

    /*
     * Token içindeki kullanıcı id değeri.
     */
    private Long userId;

    /*
     * Token içindeki kullanıcı email değeri.
     */
    private String email;

    /*
     * Token içindeki kullanıcı adı.
     */
    private String username;

    /*
     * Token içindeki rol bilgisi.
     */
    private String role;

    /*
     * Açıklama mesajı.
     */
    private String message;
}
