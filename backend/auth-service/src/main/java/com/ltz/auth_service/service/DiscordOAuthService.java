package com.ltz.auth_service.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.ltz.auth_service.exception.OAuthAuthenticationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/*
 * Discord ile giriş (OAuth2 Authorization Code akışı).
 *
 * Akış:
 *  1) buildLoginRedirectUrl(): kullanıcıyı Discord authorize sayfasına yönlendirecek URL'i üretir.
 *  2) exchangeCodeForUser(): callback'te gelen "code" ile access token alır,
 *     ardından /users/@me ile kullanıcı kimliğini (id, username, email) çeker.
 *
 * Steam'den farkı: Discord OAuth2'dir ve e-posta verir (scope: identify email).
 */
@Service
public class DiscordOAuthService {

    private static final String AUTHORIZE_ENDPOINT = "https://discord.com/oauth2/authorize";
    private static final String TOKEN_ENDPOINT = "https://discord.com/api/oauth2/token";
    private static final String USER_ENDPOINT = "https://discord.com/api/users/@me";

    @Value("${discord.client-id:}")
    private String clientId;

    @Value("${discord.client-secret:}")
    private String clientSecret;

    @Value("${discord.redirect-uri:}")
    private String redirectUri;

    private final RestClient restClient;

    public DiscordOAuthService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    /*
     * Discord authorize yönlendirme URL'ini üretir.
     *
     * TODO: CSRF için "state" parametresi üretilip callback'te doğrulanabilir (test aşamasında atlandı).
     */
    public String buildLoginRedirectUrl() {
        return UriComponentsBuilder.fromUriString(AUTHORIZE_ENDPOINT)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "identify email")
                .build()
                .toUriString();
    }

    /*
     * Authorization code'u access token ile değiştirir ve Discord kullanıcı bilgisini döndürür.
     */
    public DiscordUser exchangeCodeForUser(String code) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);

        DiscordTokenResponse token;
        try {
            token = restClient.post()
                    .uri(TOKEN_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(DiscordTokenResponse.class);
        } catch (Exception exception) {
            throw new OAuthAuthenticationException("Discord token alınamadı.");
        }

        if (token == null || token.accessToken() == null) {
            throw new OAuthAuthenticationException("Discord token yanıtı geçersiz.");
        }

        DiscordUserResponse user;
        try {
            user = restClient.get()
                    .uri(USER_ENDPOINT)
                    .header("Authorization", "Bearer " + token.accessToken())
                    .retrieve()
                    .body(DiscordUserResponse.class);
        } catch (Exception exception) {
            throw new OAuthAuthenticationException("Discord kullanıcı bilgisi alınamadı.");
        }

        if (user == null || user.id() == null) {
            throw new OAuthAuthenticationException("Discord kullanıcı bilgisi geçersiz.");
        }

        return new DiscordUser(user.id(), user.username(), user.email());
    }

    /* OAuthController'a taşınacak sade kullanıcı modeli. */
    public record DiscordUser(String id, String username, String email) {
    }

    /* Discord API yanıt modelleri (yalnızca ihtiyaç duyulan alanlar). */

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DiscordTokenResponse(@JsonProperty("access_token") String accessToken) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DiscordUserResponse(String id, String username, String email) {
    }
}
