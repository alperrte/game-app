package com.ltz.social_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.social_service.client.GameServiceClient;
import com.ltz.social_service.config.properties.GameServiceClientProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameCatalogServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GameServiceClientProperties properties = new GameServiceClientProperties(
            "http://localhost:7073",
            Duration.ofSeconds(3),
            Duration.ofSeconds(15),
            "/api/games",
            "/api/games/platforms",
            "/api/games/external/apps",
            "STEAM",
            1,
            50000,
            "Steam"
    );

    private GameServiceClient gameServiceClient;
    private GameCatalogService gameCatalogService;

    @BeforeEach
    void setUp() {
        gameServiceClient = mock(GameServiceClient.class);
        gameCatalogService = new GameCatalogService(
                gameServiceClient,
                properties,
                objectMapper
        );
    }

    @Test
    void returnsGameServiceCatalogWhenCatalogIsNotEmpty() {
        Map<String, String> queryParams = Map.of("search", "portal");
        String response = "[{\"id\":1,\"title\":\"Portal\"}]";

        when(gameServiceClient.getGames(queryParams, "Bearer token"))
                .thenReturn(response);

        assertThat(gameCatalogService.getGames(queryParams, "Bearer token"))
                .isEqualTo(response);
    }

    @Test
    void mapsExternalSteamCatalogWhenGameCatalogIsEmpty() throws Exception {
        when(gameServiceClient.getGames(Map.of(), null)).thenReturn("[]");
        when(gameServiceClient.getExternalGames(null))
                .thenReturn("""
                        {
                          "items": [
                            {
                              "externalId": "620",
                              "source": "STEAM",
                              "title": "Portal 2",
                              "coverImageUrl": "https://example.com/portal-2.jpg"
                            }
                          ]
                        }
                        """);

        String response = gameCatalogService.getGames(Map.of(), null);
        JsonNode games = objectMapper.readTree(response);

        assertThat(games).hasSize(1);
        assertThat(games.get(0).path("id").asLong()).isEqualTo(620);
        assertThat(games.get(0).path("title").asText()).isEqualTo("Portal 2");
        assertThat(games.get(0).path("platform").asText()).isEqualTo("Steam");
        verify(gameServiceClient).getExternalGames(null);
    }

    @Test
    void delegatesPlatformRequestToGameServiceClient() {
        when(gameServiceClient.getPlatforms("Bearer token"))
                .thenReturn("[{\"id\":1,\"name\":\"PC\"}]");

        assertThat(gameCatalogService.getPlatforms("Bearer token"))
                .isEqualTo("[{\"id\":1,\"name\":\"PC\"}]");
    }
}
