package com.ltz.user_service.dto.client.response;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
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
