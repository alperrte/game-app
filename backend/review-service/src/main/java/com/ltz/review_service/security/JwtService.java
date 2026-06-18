package com.ltz.review_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    public JwtUserPrincipal extractUserPrincipal(String token) {
        Claims claims = extractClaims(token);

        Long userId = extractUserId(claims);
        String email = claims.getSubject();
        String role = extractRole(claims);

        return new JwtUserPrincipal(userId, email, role);
    }

    private Long extractUserId(Claims claims) {
        Object userIdClaim = claims.get("userId");

        if (userIdClaim == null) {
            return null;
        }

        if (userIdClaim instanceof Integer integerUserId) {
            return integerUserId.longValue();
        }

        if (userIdClaim instanceof Long longUserId) {
            return longUserId;
        }

        return Long.valueOf(userIdClaim.toString());
    }

    private String extractRole(Claims claims) {
        Object roleClaim = claims.get("role");

        if (roleClaim == null) {
            return null;
        }

        return roleClaim.toString();
    }

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}