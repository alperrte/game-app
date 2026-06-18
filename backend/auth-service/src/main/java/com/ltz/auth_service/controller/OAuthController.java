package com.ltz.auth_service.controller;

import com.ltz.auth_service.dto.response.AuthResponse;
import com.ltz.auth_service.entity.enums.AuthProvider;
import com.ltz.auth_service.service.AuthService;
import com.ltz.auth_service.service.SteamOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

/*
 * Harici sağlayıcı (OAuth / OpenID) giriş uçları.
 *
 * Akış tarayıcı tabanlıdır:
 *  - GET /api/auth/steam          -> kullanıcı Steam'e yönlendirilir
 *  - GET /api/auth/steam/callback -> doğrulanır, token üretilir, frontend'e yönlendirilir
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class OAuthController {

    private final SteamOAuthService steamOAuthService;
    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /*
     * Kullanıcıyı Steam OpenID login sayfasına yönlendirir.
     */
    @GetMapping("/steam")
    public ResponseEntity<Void> steamLogin() {
        String redirectUrl = steamOAuthService.buildLoginRedirectUrl();

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    /*
     * Steam dönüşünü doğrular, kullanıcıyı bulur/oluşturur ve token'larla frontend'e yönlendirir.
     *
     * Steam tüm openid.* parametrelerini query string olarak gönderir.
     */
    @GetMapping("/steam/callback")
    public ResponseEntity<Void> steamCallback(@RequestParam Map<String, String> params) {

        String steamId = steamOAuthService.verifyAndExtractSteamId(params);
        String personaName = steamOAuthService.fetchPersonaName(steamId);

        AuthResponse authResponse = authService.loginWithProvider(
                AuthProvider.STEAM,
                steamId,
                personaName,
                null
        );

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(buildFrontendRedirect(authResponse))
                .build();
    }

    /*
     * Token'ları URL fragment (#) ile taşır; query parametresi KULLANILMAZ.
     *
     * Query param ile gönderilseydi token'lar:
     *   - Sunucu / proxy access log'larına düşerdi
     *   - Tarayıcı geçmişine kaydolurdu
     *   - Referer header'ı üzerinden 3. parti kaynaklara sızabilirdi
     *
     * Fragment (#) sunucuya iletilmez, log'a girmez ve Referer'a dahil edilmez.
     * Frontend hash'i okur okumaz window.history.replaceState ile adresten temizler.
     */
    private URI buildFrontendRedirect(AuthResponse authResponse) {
        String base = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/oauth/callback")
                .build()
                .toUriString();

        String fragment = "accessToken=" + authResponse.getAccessToken()
                + "&refreshToken=" + authResponse.getRefreshToken();

        return URI.create(base + "#" + fragment);
    }
}
