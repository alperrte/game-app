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
public class EpicGamesClient {

    private final WebClient webClient;

    @SuppressWarnings("unchecked")
    public Mono<Map<String, Object>> getFreeGames() {
        String graphqlQuery = "{\"query\":\"{ Catalog { searchStore(category: \\\"freegames\\\", limit: 5) { elements { title keyImages { type url } promotions { promotionalOffers { promotionalOffers { startDate endDate discountSetting { discountType discountPercentage } } } } } } } }\"}";

        return webClient.post()
                .uri("https://graphql.epicgames.com/graphql")
                .header("Content-Type", "application/json")
                .bodyValue(graphqlQuery)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(e -> {
                    log.error("Epic Games GraphQL API error: ", e);
                    return Mono.empty();
                });
    }
}
