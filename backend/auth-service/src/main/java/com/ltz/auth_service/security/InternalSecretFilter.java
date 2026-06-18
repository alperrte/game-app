package com.ltz.auth_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/*
 * /internal/** isteklerini korur.
 *
 * X-Internal-Secret header'ı yapılandırılmış secret ile eşleşirse
 * ROLE_INTERNAL yetkisiyle SecurityContext doldurulur; Spring Security devam eder.
 * Header yoksa veya yanlışsa context boş kalır, SecurityConfig'deki
 * hasRole("INTERNAL") kuralı isteği 403 ile reddeder.
 *
 * Karşılaştırma MessageDigest.isEqual ile yapılır (constant-time);
 * normal .equals() timing saldırısına açıktır.
 */
public class InternalSecretFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "X-Internal-Secret";
    private static final String INTERNAL_PATH_PREFIX = "/internal/";

    private final byte[] expectedSecretBytes;

    public InternalSecretFilter(String internalSecret) {
        this.expectedSecretBytes = internalSecret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!request.getRequestURI().startsWith(INTERNAL_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader(HEADER_NAME);

        if (header != null && isSecretValid(header)) {
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            "internal-service",
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_INTERNAL"))
                    );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    /*
     * Constant-time karşılaştırma: her iki byte dizisi aynı sürede işlenir,
     * timing farkından secret tahmini yapılamaz.
     */
    private boolean isSecretValid(String header) {
        byte[] headerBytes = header.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(headerBytes, expectedSecretBytes);
    }
}
