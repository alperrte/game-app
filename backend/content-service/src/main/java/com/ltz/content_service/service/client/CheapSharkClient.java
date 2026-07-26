package com.ltz.content_service.service.client;

import com.ltz.content_service.service.client.dto.CheapSharkDeal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CheapSharkClient {

    private final WebClient webClient;

    private static final int PAGE_SIZE = 60;
    private static final int PAGE_COUNT = 3;

    public Mono<List<CheapSharkDeal>> getDeals() {
        return Flux.range(0, PAGE_COUNT)
                .concatMap(this::fetchPage)
                .flatMapIterable(list -> list)
                .collectList()
                .onErrorResume(e -> {
                    log.error("CheapShark API error: ", e);
                    return Mono.just(List.of());
                });
    }

    private Mono<List<CheapSharkDeal>> fetchPage(int pageNumber) {
        return webClient.get()
                .uri("https://www.cheapshark.com/api/1.0/deals?pageSize=" + PAGE_SIZE
                        + "&pageNumber=" + pageNumber + "&sortBy=Deal%20Rating")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream().map(CheapSharkDeal::fromMap).collect(Collectors.toList()))
                .onErrorReturn(List.of());
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
