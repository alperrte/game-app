package com.ltz.auth_service.security;

import com.ltz.auth_service.entity.UserCredential;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    /*
     * Kullanıcı bilgilerine göre access token üretir.
     */
    public String generateAccessToken(UserCredential userCredential) {
        Map<String, Object> claims = new HashMap<>();

        claims.put("userId", userCredential.getId());
        claims.put("email", userCredential.getEmail());
        claims.put("username", userCredential.getUsername());
        claims.put("role", userCredential.getRole().getName());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userCredential.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /*
     * Token içinden email bilgisini çıkarır.
     * Biz subject alanına email koyuyoruz.
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /*
     * Token içinden userId bilgisini çıkarır.
     */
    public Long extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");

        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        }

        if (userId instanceof Long) {
            return (Long) userId;
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
     * Token geçerli mi kontrol eder.
     */
    public boolean isTokenValid(String token, UserCredential userCredential) {
        String email = extractEmail(token);

        return email.equals(userCredential.getEmail()) && !isTokenExpired(token);
    }

    /*
     * Token süresi dolmuş mu kontrol eder.
     */
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /*
     * Token bitiş tarihini çıkarır.
     */
    private Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    /*
     * Token içindeki tüm claim bilgilerini çıkarır.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /*
     * JWT imzalama anahtarını hazırlar.
     *
     * JWT_SECRET env değişkeni düz metin (plain string) olarak verilmelidir.
     * HMAC-SHA256 için en az 32 karakter (256 bit) uzunluğunda olması zorunludur.
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
}
