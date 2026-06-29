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
public class SpeedrunClient {

    private final WebClient webClient;

    public Mono<Map<String, Object>> getLeaderboard(String gameId, String categoryId) {
        String uri = String.format("https://www.speedrun.com/api/v1/leaderboards/%s/category/%s?top=1", gameId,
                categoryId);
        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .onErrorResume(e -> {
                    log.error("Speedrun API error: ", e);
                    return Mono.empty();
                });
    }
}
