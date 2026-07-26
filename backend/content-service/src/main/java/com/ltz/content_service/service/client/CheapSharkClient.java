package com.ltz.content_service.service.client;

import com.ltz.content_service.service.client.dto.CheapSharkDeal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CheapSharkClient {

    private final WebClient webClient;

    public Mono<List<CheapSharkDeal>> getDeals() {
        return webClient.get()
                .uri("https://www.cheapshark.com/api/1.0/deals?upperPrice=50&pageSize=20")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream().map(CheapSharkDeal::fromMap).collect(Collectors.toList()))
                .onErrorResume(e -> {
                    log.error("CheapShark API error: ", e);
                    return Mono.empty();
                });
    }

    public Mono<Map<String, Object>> getGameDetails(String gameId) {
        return webClient.get()
                .uri("https://www.cheapshark.com/api/1.0/games?id=" + gameId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(e -> {
                    log.error("CheapShark Game Details API error: ", e);
                    return Mono.empty();
                });
    }
}
