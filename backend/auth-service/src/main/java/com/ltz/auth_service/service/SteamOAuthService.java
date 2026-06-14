package com.ltz.auth_service.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ltz.auth_service.exception.OAuthAuthenticationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * Steam ile giriş (OpenID 2.0).
 *
 * Akış:
 *  1) buildLoginRedirectUrl(): kullanıcıyı Steam OpenID login sayfasına yönlendirecek URL'i üretir.
 *  2) verifyAndExtractSteamId(): Steam'in callback'te döndürdüğü openid.* parametrelerini
 *     Steam'e geri sorarak (check_authentication) DOĞRULAR ve SteamID64'ü çıkarır.
 *  3) fetchPersonaName(): (opsiyonel) Steam Web API ile görünen kullanıcı adını alır.
 *
 * Not: Steam OAuth2 DEĞİL OpenID 2.0 kullanır ve e-posta vermez.
 */
@Service
public class SteamOAuthService {

    private static final String STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
    private static final String STEAM_SUMMARIES_ENDPOINT =
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";
    private static final Pattern STEAM_ID_PATTERN =
            Pattern.compile("https://steamcommunity\\.com/openid/id/(\\d+)");

    @Value("${app.public-base-url}")
    private String publicBaseUrl;

    @Value("${steam.api-key:}")
    private String steamApiKey;

    private final RestClient restClient;

    public SteamOAuthService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    /*
     * Steam OpenID login yönlendirme URL'ini üretir.
     * Steam doğrulama sonrası tarayıcıyı return_to adresimize geri gönderir.
     */
    public String buildLoginRedirectUrl() {
        String returnTo = publicBaseUrl + "/api/auth/steam/callback";

        return UriComponentsBuilder.fromUriString(STEAM_OPENID_ENDPOINT)
                .queryParam("openid.ns", "http://specs.openid.net/auth/2.0")
                .queryParam("openid.mode", "checkid_setup")
                .queryParam("openid.return_to", returnTo)
                .queryParam("openid.realm", publicBaseUrl)
                .queryParam("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select")
                .queryParam("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select")
                .build()
                .toUriString();
    }

    /*
     * Callback'te gelen openid.* parametrelerini Steam'e geri sorarak doğrular
     * ve geçerliyse SteamID64 değerini döndürür.
     */
    public String verifyAndExtractSteamId(Map<String, String> params) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        params.forEach(form::add);

        /*
         * Doğrulama için mode 'check_authentication' olmalıdır.
         */
        form.set("openid.mode", "check_authentication");

        String response = restClient.post()
                .uri(STEAM_OPENID_ENDPOINT)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(String.class);

        if (response == null || !response.contains("is_valid:true")) {
            throw new OAuthAuthenticationException("Steam doğrulaması başarısız oldu.");
        }

        String claimedId = params.get("openid.claimed_id");

        if (claimedId == null) {
            throw new OAuthAuthenticationException("Steam claimed_id parametresi bulunamadı.");
        }

        Matcher matcher = STEAM_ID_PATTERN.matcher(claimedId);

        if (!matcher.find()) {
            throw new OAuthAuthenticationException("Steam ID çözümlenemedi.");
        }

        return matcher.group(1);
    }

    /*
     * Steam Web API üzerinden görünen kullanıcı adını (personaname) getirir.
     * API key tanımlı değilse veya çağrı başarısız olursa null döner (kullanıcı adı fallback ile üretilir).
     */
    public String fetchPersonaName(String steamId) {

        if (steamApiKey == null || steamApiKey.isBlank()) {
            return null;
        }

        try {
            SteamSummariesResponse summaries = restClient.get()
                    .uri(STEAM_SUMMARIES_ENDPOINT + "?key={key}&steamids={id}", steamApiKey, steamId)
                    .retrieve()
                    .body(SteamSummariesResponse.class);

            if (summaries != null
                    && summaries.response() != null
                    && summaries.response().players() != null
                    && !summaries.response().players().isEmpty()) {

                return summaries.response().players().get(0).personaname();
            }
        } catch (Exception ignored) {
            /* Profil adı alınamazsa kritik değil; fallback kullanılır. */
        }

        return null;
    }

    /* Steam Web API yanıt modelleri (yalnızca ihtiyaç duyulan alanlar). */

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SteamSummariesResponse(SteamResponse response) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SteamResponse(List<SteamPlayer> players) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SteamPlayer(String steamid, String personaname) {
    }
}
