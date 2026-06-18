package com.ltz.review_service.config;

import com.ltz.review_service.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // Actuator
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        // Moderation endpoints
                        // TODO: Role yapısı netleşince burası ADMIN rolüyle sınırlandırılmalı.
                        .requestMatchers(HttpMethod.GET, "/api/reviews/reports/pending").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/reports/*/status").authenticated()

                        // Public internal review read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/reviews/game/*/average-rating").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/game/*/top").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/game/*").permitAll()

                        // Public external review read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/reviews/external/*/*/average-rating").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/external/*/*/top").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/external/*/*").permitAll()

                        // Public common review read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/reviews/user/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/*").permitAll()

                        // Authenticated review write/action endpoints
                        .requestMatchers(HttpMethod.POST, "/api/reviews").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/like").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/*/like").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/report").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}