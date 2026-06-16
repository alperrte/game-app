package com.ltz.user_service.security;

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
        ReflectionTestUtils.setField(jwtService, "jwtSecret", secret);
    }

    private String generateToken(String subject, Object userId, long expirationMs) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        Key key = Keys.hmacShaKeyFor(keyBytes);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", subject);
        claims.put("email", subject + "@example.com");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    void testGetUsername() {
        String token = generateToken("johndoe", 12345L, 3600000);
        String username = jwtService.getUsername(token);
        assertEquals("johndoe", username);
    }

    @Test
    void testGetUserId_Long() {
        String token = generateToken("johndoe", 12345L, 3600000);
        Long userId = jwtService.getUserId(token);
        assertEquals(12345L, userId);
    }

    @Test
    void testGetUserId_Integer() {
        String token = generateToken("johndoe", 12345, 3600000);
        Long userId = jwtService.getUserId(token);
        assertEquals(12345L, userId);
    }

    @Test
    void testGetEmail() {
        String token = generateToken("johndoe", 12345L, 3600000);
        String email = jwtService.getEmail(token);
        assertEquals("johndoe@example.com", email);
    }

    @Test
    void testValidateToken_Success() {
        String token = generateToken("johndoe", 12345L, 3600000);
        assertTrue(jwtService.validateToken(token));
    }

    @Test
    void testValidateToken_Expired() {
        String token = generateToken("johndoe", 12345L, -3600000);
        assertFalse(jwtService.validateToken(token));
    }

    @Test
    void testValidateToken_Malformed() {
        assertFalse(jwtService.validateToken("invalid.token.structure"));
    }
}
