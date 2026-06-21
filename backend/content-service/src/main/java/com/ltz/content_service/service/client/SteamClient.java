package com.ltz.content_service.service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SteamClient {

    private final WebClient webClient;

    @SuppressWarnings("unchecked")
    public Mono<Long> getPlayerCount(long appId) {
        return webClient.get()
                .uri("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" + appId)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    try {
                        Map<String, Object> responseMap = (Map<String, Object>) response.get("response");
                        if (responseMap != null && responseMap.containsKey("player_count")) {
                            return ((Number) responseMap.get("player_count")).longValue();
                        }
                        return 0L;
                    } catch (Exception e) {
                        log.error("Error parsing player count from Steam API for appid {}: ", appId, e);
                        return 0L;
                    }
                })
                .onErrorResume(e -> {
                    log.error("Steam API error for appid {}: ", appId, e);
                    return Mono.just(0L);
                });
    }

    public Mono<Long> getCS2PlayerCount() {
        return getPlayerCount(730L);
    }

    @SuppressWarnings("unchecked")
    public Mono<Long> getGlobalSteamPlayerCount() {
        return webClient.get()
                .uri("https://store.steampowered.com/stats/userdata.json")
                .retrieve()
                .bodyToMono(java.util.List.class)
                .map(responseList -> {
                    try {
                        if (responseList != null && !responseList.isEmpty()) {
                            Map<String, Object> firstEntry = (Map<String, Object>) responseList.get(0);
                            java.util.List<java.util.List<Number>> dataPoints = (java.util.List<java.util.List<Number>>) firstEntry.get("data");
                            if (dataPoints != null && !dataPoints.isEmpty()) {
                                java.util.List<Number> lastPoint = dataPoints.get(dataPoints.size() - 1);
                                if (lastPoint != null && lastPoint.size() >= 2) {
                                    return lastPoint.get(1).longValue();
                                }
                            }
                        }
                        return 18500000L;
                    } catch (Exception e) {
                        log.error("Error parsing global Steam player count from store.steampowered.com: ", e);
                        return 18500000L;
                    }
                })
                .onErrorResume(e -> {
                    log.error("Error fetching global Steam player count: ", e);
                    return Mono.just(18500000L);
                });
    }

    @SuppressWarnings("unchecked")
    public Mono<String> getProtonDbCompatibility(long steamAppId) {
        return webClient.get()
                .uri("https://www.protondb.com/api/v1/reports/summaries/" + steamAppId + ".json")
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    try {
                        String tier = (String) response.get("tier");
                        if (tier != null) {
                            switch (tier.toLowerCase()) {
                                case "platinum":
                                case "gold":
                                    return "VERIFIED";
                                case "silver":
                                case "bronze":
                                    return "PLAYABLE";
                                case "borked":
                                    return "UNSUPPORTED";
                                default:
                                    return "UNKNOWN";
                            }
                        }
                        return "UNKNOWN";
                    } catch (Exception e) {
                        return "UNKNOWN";
                    }
                })
                .onErrorResume(e -> Mono.just("UNKNOWN"));
    }
}
