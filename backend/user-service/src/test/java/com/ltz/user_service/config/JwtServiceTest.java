package com.ltz.user_service.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String secret = "LTZ_AUTH_SERVICE_SECRET_KEY_2026_SUPER_SECURE_123456";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
    }

    private String generateToken(String subject, String userId, long expirationMs) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        Key key = Keys.hmacShaKeyFor(keyBytes);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    void testExtractUsername() {
        String token = generateToken("johndoe", "12345", 3600000);
        String username = jwtService.extractUsername(token);
        assertEquals("johndoe", username);
    }

    @Test
    void testExtractUserId() {
        String token = generateToken("johndoe", "12345", 3600000);
        String userId = jwtService.extractUserId(token);
        assertEquals("12345", userId);
    }

    @Test
    void testIsTokenValid_Success() {
        String token = generateToken("johndoe", "12345", 3600000);
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void testIsTokenValid_Expired() {
        String token = generateToken("johndoe", "12345", -3600000);
        assertFalse(jwtService.isTokenValid(token));
    }

    @Test
    void testIsTokenValid_Malformed() {
        assertFalse(jwtService.isTokenValid("invalid.token.structure"));
    }
}
