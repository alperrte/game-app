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

    private static final String USER_ID_CLAIM = "userId";
    private static final String EMAIL_CLAIM = "email";
    private static final String ROLE_CLAIM = "role";
    private static final String MICROSOFT_ROLE_CLAIM =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

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
        String email = extractEmail(claims);
        String role = extractRole(claims);

        return new JwtUserPrincipal(userId, email, role);
    }

    private Long extractUserId(Claims claims) {
        Object userIdClaim = claims.get(USER_ID_CLAIM);

        if (userIdClaim == null) {
            userIdClaim = claims.getSubject();
        }

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

    private String extractEmail(Claims claims) {
        Object emailClaim = claims.get(EMAIL_CLAIM);

        if (emailClaim == null) {
            return null;
        }

        return emailClaim.toString();
    }

    private String extractRole(Claims claims) {
        Object roleClaim = claims.get(ROLE_CLAIM);

        if (roleClaim == null) {
            roleClaim = claims.get(MICROSOFT_ROLE_CLAIM);
        }

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