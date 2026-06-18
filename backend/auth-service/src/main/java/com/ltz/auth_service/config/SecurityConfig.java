package com.ltz.auth_service.config;

import com.ltz.auth_service.security.InternalSecretFilter;
import com.ltz.auth_service.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.client.RestClient;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Value("${internal.secret}")
    private String internalSecret;

    /*
     * Hangi endpointlerin public, hangi endpointlerin token istediğini belirler.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                /*
                 * REST API kullandığımız için CSRF kapalı.
                 */
                .csrf(csrf -> csrf.disable())

                /*
                 * Frontend, Gateway ve Swagger istekleri için CORS.
                 */
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                /*
                 * JWT kullandığımız için session tutulmaz.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                /*
                 * Endpoint yetkilendirme kuralları.
                 */
                .authorizeHttpRequests(auth -> auth

                        /*
                         * Test aşamasında tüm auth endpointleri public.
                         */
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/refresh-token",
                                "/api/auth/logout",
                                "/api/auth/validate-token",
                                "/api/auth/steam",
                                "/api/auth/steam/callback"
                        ).permitAll()

                        /*
                         * Dahili servis endpoint'leri — yalnızca ROLE_INTERNAL yetkisiyle erişilir.
                         * InternalSecretFilter X-Internal-Secret header'ını doğrular ve
                         * geçerliyse bu rolü SecurityContext'e yazar.
                         */
                        .requestMatchers("/internal/**").hasRole("INTERNAL")

                        /*
                         * Swagger endpointleri public.
                         */
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        /*
                         * Actuator health/info public.
                         */
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        /*
                         * Diğer tüm endpointler token ister.
                         */
                        .anyRequest().authenticated()
                )

                /*
                 * Kullanıcı doğrulama provider'ı.
                 */
                .authenticationProvider(authenticationProvider())

                /*
                 * InternalSecretFilter JWT filter'dan önce çalışır:
                 * /internal/** isteklerinde X-Internal-Secret header'ını kontrol eder,
                 * geçerliyse ROLE_INTERNAL auth set eder.
                 */
                .addFilterBefore(
                        new InternalSecretFilter(internalSecret),
                        UsernamePasswordAuthenticationFilter.class
                )

                /*
                 * JWT filter, Spring Security filter zincirine eklenir.
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    /*
     * Spring Security'nin kullanıcıyı nasıl bulacağını ve şifreyi nasıl kontrol edeceğini söyler.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider =
                new DaoAuthenticationProvider(userDetailsService);

        authenticationProvider.setPasswordEncoder(passwordEncoder());

        return authenticationProvider;
    }

    /*
     * Login işleminde kullanılır.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /*
     * Şifreleri BCrypt ile hashler.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /*
     * CORS ayarları.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:7070",
                "http://localhost:7071"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin"
        ));

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}