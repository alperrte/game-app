package com.ltz.review_service.config;

import com.ltz.review_service.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

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

                        // Moderation endpoints - only ADMIN / MODERATOR
                        .requestMatchers(HttpMethod.GET, "/api/reviews/reports/pending")
                        .hasAnyRole("ADMIN", "MODERATOR")

                        .requestMatchers(HttpMethod.PUT, "/api/reviews/reports/*/status")
                        .hasAnyRole("ADMIN", "MODERATOR")

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
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:7070",
                "http://localhost:8080"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}