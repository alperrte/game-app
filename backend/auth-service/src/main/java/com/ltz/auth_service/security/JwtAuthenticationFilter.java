package com.ltz.auth_service.security;

import com.ltz.auth_service.repository.UserCredentialRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomerUserDetailsService customUserDetailsService;
    private final UserCredentialRepository userCredentialRepository;

    /*
     * Her HTTP isteğinde bir kez çalışır.
     * Authorization header içindeki Bearer token'ı kontrol eder.
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        /*
         * Header yoksa veya Bearer ile başlamıyorsa
         * bu isteği güvenlik doğrulaması yapmadan devam ettiriyoruz.
         *
         * Örnek public endpointler:
         * /api/auth/register
         * /api/auth/login
         */
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        /*
         * "Bearer " kısmı 7 karakterdir.
         * Sadece token değerini almak için substring(7) kullanıyoruz.
         */
        String token = authHeader.substring(7);
        String email;

        try {
            email = jwtService.extractEmail(token);
        } catch (Exception exception) {
            filterChain.doFilter(request, response);
            return;
        }

        /*
         * Email varsa ve daha önce authentication set edilmemişse
         * kullanıcıyı Spring Security context içine ekliyoruz.
         */
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

            userCredentialRepository.findByEmail(email).ifPresent(userCredential -> {

                if (jwtService.isTokenValid(token, userCredential)) {

                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            });
        }

        filterChain.doFilter(request, response);
    }
}