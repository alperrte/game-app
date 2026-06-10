package com.ltz.auth_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MessageResponse {

    /*
     * Kullanıcıya veya frontend'e gösterilecek basit mesaj.
     */
    private String message;
}
