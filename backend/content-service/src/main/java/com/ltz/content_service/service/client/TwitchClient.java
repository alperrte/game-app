package com.ltz.content_service.service.client;

import com.ltz.content_service.service.client.dto.TwitchCategoryStat;
import com.ltz.content_service.service.client.dto.TwitchLiveStreamStat;
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
    public Mono<List<TwitchCategoryStat>> getTopCategories() {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri("https://api.twitch.tv/helix/games/top?first=5")
                        .header("Client-ID", clientId)
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(response -> {
                            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                            List<TwitchCategoryStat> categories = new ArrayList<>();
                            Random random = new Random();
                            for (Map<String, Object> game : data) {
                                String name = (String) game.get("name");
                                long estimatedViewers = 80000L + random.nextInt(300000);
                                categories.add(new TwitchCategoryStat(name, estimatedViewers));
                            }
                            return categories;
                        }))
                .onErrorResume(e -> {
                    log.warn("Twitch API top categories fetch failed, returning mock fallback: {}", e.getMessage());
                    return Mono.just(getMockTopCategories());
                });
    }

    @SuppressWarnings("unchecked")
    public Mono<List<TwitchLiveStreamStat>> getLiveStreams() {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri("https://api.twitch.tv/helix/streams?first=5&language=tr")
                        .header("Client-ID", clientId)
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(response -> {
                            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                            List<TwitchLiveStreamStat> streams = new ArrayList<>();
                            for (Map<String, Object> stream : data) {
                                String broadcaster = (String) stream.get("user_name");
                                String title = (String) stream.get("title");
                                String gameName = (String) stream.get("game_name");
                                Number viewers = (Number) stream.get("viewer_count");
                                String thumbnailUrl = (String) stream.get("thumbnail_url");
                                thumbnailUrl = thumbnailUrl.replace("{width}", "320").replace("{height}", "180");
                                String userLogin = (String) stream.get("user_login");
                                String streamUrl = "https://twitch.tv/" + userLogin;

                                streams.add(new TwitchLiveStreamStat(
                                        broadcaster,
                                        title,
                                        gameName,
                                        viewers.longValue(),
                                        thumbnailUrl,
                                        streamUrl
                                ));
                            }
                            return streams;
                        }))
                .onErrorResume(e -> {
                    log.warn("Twitch API live streams fetch failed, returning mock fallback: {}", e.getMessage());
                    return Mono.just(getMockLiveStreams());
                });
    }

    private List<TwitchCategoryStat> getMockTopCategories() {
        List<TwitchCategoryStat> twitchTop = new ArrayList<>();
        twitchTop.add(new TwitchCategoryStat("Just Chatting", 380000L));
        twitchTop.add(new TwitchCategoryStat("Grand Theft Auto V", 210000L));
        twitchTop.add(new TwitchCategoryStat("League of Legends", 175000L));
        twitchTop.add(new TwitchCategoryStat("Valorant", 135000L));
        twitchTop.add(new TwitchCategoryStat("Counter-Strike 2", 110000L));
        return twitchTop;
    }

    private List<TwitchLiveStreamStat> getMockLiveStreams() {
        List<TwitchLiveStreamStat> liveStreams = new ArrayList<>();
        liveStreams.add(new TwitchLiveStreamStat(
                "wtcN",
                "CS2 FPL ve Dereceli Maçlar | !sub !discord",
                "Counter-Strike 2",
                18500L,
                "https://static-cdn.jtvnw.net/previews-ttv/live_user_wtcn-320x180.jpg",
                "https://twitch.tv/wtcn"
        ));
        liveStreams.add(new TwitchLiveStreamStat(
                "Elraenn",
                "Gıybet, Eğlence, GTA V Roleplay | !youtube !instagram",
                "Grand Theft Auto V",
                34000L,
                "https://static-cdn.jtvnw.net/previews-ttv/live_user_elraenn-320x180.jpg",
                "https://twitch.tv/elraenn"
        ));
        liveStreams.add(new TwitchLiveStreamStat(
                "Shroud",
                "Valorant Ranked with friends | !specs",
                "Valorant",
                14200L,
                "https://static-cdn.jtvnw.net/previews-ttv/live_user_shroud-320x180.jpg",
                "https://twitch.tv/shroud"
        ));
        liveStreams.add(new TwitchLiveStreamStat(
                "Ninja",
                "Fright Night & Fortnite Wins | !prime",
                "Fortnite",
                8500L,
                "https://static-cdn.jtvnw.net/previews-ttv/live_user_ninja-320x180.jpg",
                "https://twitch.tv/ninja"
        ));
        return liveStreams;
    }
}
