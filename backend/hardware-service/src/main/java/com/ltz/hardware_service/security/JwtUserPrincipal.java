package com.ltz.hardware_service.security;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JwtUserPrincipal {

    private Long userId;

    private String email;

    private String username;

    private String role;
}