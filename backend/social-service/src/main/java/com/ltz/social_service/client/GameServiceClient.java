package com.ltz.social_service.client;

import com.ltz.social_service.config.properties.GameServiceClientProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

@Component
public class GameServiceClient {

    private final RestClient gameServiceRestClient;
    private final GameServiceClientProperties properties;

    public GameServiceClient(
            @Qualifier("gameServiceRestClient") RestClient gameServiceRestClient,
            GameServiceClientProperties properties
    ) {
        this.gameServiceRestClient = gameServiceRestClient;
        this.properties = properties;
    }

    public String getGames(Map<String, String> queryParams, String authorization) {
        return get(properties.gamesPath(), queryParams, authorization);
    }

    public String getPlatforms(String authorization) {
        return get(properties.platformsPath(), Map.of(), authorization);
    }

    public String getExternalGames(String authorization) {
        return get(
                properties.externalAppsPath(),
                Map.of(
                        "source", properties.externalSource(),
                        "page", String.valueOf(properties.externalPage()),
                        "size", String.valueOf(properties.externalSize())
                ),
                authorization
        );
    }

    private String get(
            String path,
            Map<String, String> queryParams,
            String authorization
    ) {
        try {
            String response = gameServiceRestClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path);
                        queryParams.forEach((key, value) -> {
                            if (value != null && !value.isBlank()) {
                                uriBuilder.queryParam(key, value);
                            }
                        });
                        return uriBuilder.build();
                    })
                    .headers(headers -> addAuthorization(headers, authorization))
                    .retrieve()
                    .body(String.class);

            return response == null ? "" : response;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "Game service yanıtı alınamadı.",
                    exception
            );
        }
    }

    private void addAuthorization(HttpHeaders headers, String authorization) {
        if (authorization != null && !authorization.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
        }
    }
}
