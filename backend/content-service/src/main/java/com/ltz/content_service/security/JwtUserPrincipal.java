package com.ltz.content_service.security;

public record JwtUserPrincipal(
        Long userId,
        String email,
        String username,
        String role
) {
}
