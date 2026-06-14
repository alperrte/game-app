package com.ltz.game_service.security;

public record JwtUserPrincipal(
        Long userId,
        String email,
        String username,
        String role
) {
}
