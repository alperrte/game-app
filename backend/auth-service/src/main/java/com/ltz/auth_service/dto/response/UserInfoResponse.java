package com.ltz.auth_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserInfoResponse {

    /*
     * Kullanıcının benzersiz kimliği.
     */
    private Long userId;

    /*
     * Kullanıcının kullanıcı adı.
     */
    private String username;

    /*
     * Kullanıcının e-posta adresi.
     */
    private String email;

    /*
     * Kullanıcının rolü.
     */
    private String role;

    /*
     * Kullanıcının hesap durumu.
     */
    private String accountStatus;
}
