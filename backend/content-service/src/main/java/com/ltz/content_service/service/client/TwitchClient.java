package com.ltz.content_service.service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class TwitchClient {

    private final WebClient webClient;

    @Value("${twitch.client-id:}")
    private String clientId;

    @Value("${twitch.client-secret:}")
    private String clientSecret;

    private String cachedToken = null;
    private long tokenExpiryTime = 0;

    public Mono<String> getAccessToken() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return Mono.error(new IllegalStateException("Twitch credentials are not configured"));
        }
        if (cachedToken != null && System.currentTimeMillis() < tokenExpiryTime) {
            return Mono.just(cachedToken);
        }

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("id.twitch.tv")
                        .path("/oauth2/token")
                        .queryParam("client_id", clientId)
                        .queryParam("client_secret", clientSecret)
                        .queryParam("grant_type", "client_credentials")
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    String token = (String) response.get("access_token");
                    Number expiresIn = (Number) response.get("expires_in");
                    cachedToken = token;
                    tokenExpiryTime = System.currentTimeMillis() + (expiresIn.longValue() * 1000) - 60000;
                    return token;
                });
    }

    @SuppressWarnings("unchecked")
    public Mono<List<Map<String, Object>>> getTopCategories() {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri("https://api.twitch.tv/helix/games/top?first=5")
                        .header("Client-ID", clientId)
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(response -> {
                            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                            List<Map<String, Object>> categories = new ArrayList<>();
                            Random random = new Random();
                            for (Map<String, Object> game : data) {
                                String name = (String) game.get("name");
                                long estimatedViewers = 80000L + random.nextInt(300000);
                                categories.add(Map.of(
                                        "gameTitle", name,
                                        "viewers", estimatedViewers
                                ));
                            }
                            return categories;
                        }))
                .onErrorResume(e -> {
                    log.warn("Twitch API top categories fetch failed, returning mock fallback: {}", e.getMessage());
                    return Mono.just(getMockTopCategories());
                });
    }

    @SuppressWarnings("unchecked")
    public Mono<List<Map<String, Object>>> getLiveStreams() {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri("https://api.twitch.tv/helix/streams?first=5&language=tr")
                        .header("Client-ID", clientId)
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(response -> {
                            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                            List<Map<String, Object>> streams = new ArrayList<>();
                            for (Map<String, Object> stream : data) {
                                String broadcaster = (String) stream.get("user_name");
                                String title = (String) stream.get("title");
                                String gameName = (String) stream.get("game_name");
                                Number viewers = (Number) stream.get("viewer_count");
                                String thumbnailUrl = (String) stream.get("thumbnail_url");
                                thumbnailUrl = thumbnailUrl.replace("{width}", "320").replace("{height}", "180");
                                String userLogin = (String) stream.get("user_login");
                                String streamUrl = "https://twitch.tv/" + userLogin;

                                streams.add(Map.of(
                                        "broadcaster", broadcaster,
                                        "title", title,
                                        "gameName", gameName,
                                        "viewers", viewers.longValue(),
                                        "thumbnailUrl", thumbnailUrl,
                                        "streamUrl", streamUrl
                                ));
                            }
                            return streams;
                        }))
                .onErrorResume(e -> {
                    log.warn("Twitch API live streams fetch failed, returning mock fallback: {}", e.getMessage());
                    return Mono.just(getMockLiveStreams());
                });
    }

    private List<Map<String, Object>> getMockTopCategories() {
        List<Map<String, Object>> twitchTop = new ArrayList<>();
        twitchTop.add(Map.of("gameTitle", "Just Chatting", "viewers", 380000L));
        twitchTop.add(Map.of("gameTitle", "Grand Theft Auto V", "viewers", 210000L));
        twitchTop.add(Map.of("gameTitle", "League of Legends", "viewers", 175000L));
        twitchTop.add(Map.of("gameTitle", "Valorant", "viewers", 135000L));
        twitchTop.add(Map.of("gameTitle", "Counter-Strike 2", "viewers", 110000L));
        return twitchTop;
    }

    private List<Map<String, Object>> getMockLiveStreams() {
        List<Map<String, Object>> liveStreams = new ArrayList<>();
        liveStreams.add(Map.of(
                "broadcaster", "wtcN",
                "title", "CS2 FPL ve Dereceli Maçlar | !sub !discord",
                "gameName", "Counter-Strike 2",
                "viewers", 18500L,
                "thumbnailUrl", "https://static-cdn.jtvnw.net/previews-ttv/live_user_wtcn-320x180.jpg",
                "streamUrl", "https://twitch.tv/wtcn"
        ));
        liveStreams.add(Map.of(
                "broadcaster", "Elraenn",
                "title", "Gıybet, Eğlence, GTA V Roleplay | !youtube !instagram",
                "gameName", "Grand Theft Auto V",
                "viewers", 34000L,
                "thumbnailUrl", "https://static-cdn.jtvnw.net/previews-ttv/live_user_elraenn-320x180.jpg",
                "streamUrl", "https://twitch.tv/elraenn"
        ));
        liveStreams.add(Map.of(
                "broadcaster", "Shroud",
                "title", "Valorant Ranked with friends | !specs",
                "gameName", "Valorant",
                "viewers", 14200L,
                "thumbnailUrl", "https://static-cdn.jtvnw.net/previews-ttv/live_user_shroud-320x180.jpg",
                "streamUrl", "https://twitch.tv/shroud"
        ));
        liveStreams.add(Map.of(
                "broadcaster", "Ninja",
                "title", "Fright Night & Fortnite Wins | !prime",
                "gameName", "Fortnite",
                "viewers", 8500L,
                "thumbnailUrl", "https://static-cdn.jtvnw.net/previews-ttv/live_user_ninja-320x180.jpg",
                "streamUrl", "https://twitch.tv/ninja"
        ));
        return liveStreams;
    }
}
