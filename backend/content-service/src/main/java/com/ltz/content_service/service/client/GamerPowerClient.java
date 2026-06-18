package com.ltz.content_service.service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GamerPowerClient {

    private final WebClient webClient;

    public Mono<List<Map<String, Object>>> getGiveaways() {
        return webClient.get()
                .uri("https://www.gamerpower.com/api/giveaways")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .onErrorResume(e -> {
                    log.error("GamerPower API error: ", e);
                    return Mono.empty();
                });
    }
}
