package com.ltz.hardware_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /*
     * Token geçerli mi kontrol eder.
     * Hardware-service token üretmez; sadece auth-service tokenını doğrular.
     */
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception exception) {
            return false;
        }
    }

    /*
     * Auth-service JWT subject alanına email koyuyor.
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /*
     * Token içinden userId bilgisini çıkarır.
     */
    public Long extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");

        if (userId instanceof Integer integerUserId) {
            return integerUserId.longValue();
        }

        if (userId instanceof Long longUserId) {
            return longUserId;
        }

        return Long.valueOf(userId.toString());
    }

    /*
     * Token içinden username bilgisini çıkarır.
     */
    public String extractUsername(String token) {
        return extractAllClaims(token).get("username", String.class);
    }

    /*
     * Token içinden role bilgisini çıkarır.
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /*
     * Token süresi dolmuş mu kontrol eder.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /*
     * Token expiration bilgisini çıkarır.
     */
    private Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    /*
     * Token içindeki tüm claimleri çıkarır.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /*
     * Auth-service ile aynı JWT_SECRET kullanılmalıdır.
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
}