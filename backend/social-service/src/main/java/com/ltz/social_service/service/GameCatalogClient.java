package com.ltz.social_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GameCatalogClient {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private static final int EXTERNAL_CATALOG_SIZE = 50000;

    @Value("${GAME_SERVICE_URL:http://localhost:7073}")
    private String gameServiceUrl;

    public String getGames(Map<String, String> queryParams, String authorization) {
        String gamesJson = getJson("/api/games", queryParams, authorization);

        if (!isEmptyArray(gamesJson)) {
            return gamesJson;
        }

        return getExternalGamesCatalog(authorization);
    }

    public String getPlatforms(String authorization) {
        return getJson("/api/games/platforms", Map.of(), authorization);
    }

    private String getJson(
            String path,
            Map<String, String> queryParams,
            String authorization
    ) {
        String url = normalizeBaseUrl(gameServiceUrl) + path + buildQuery(queryParams);
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(url))
                .GET()
                .header("Accept", "application/json");

        if (authorization != null && !authorization.isBlank()) {
            requestBuilder.header("Authorization", authorization);
        }

        HttpRequest request = requestBuilder.build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Game service yanıt veremedi."
                );
            }

            return response.body();
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Game service yanıtı okunamadı.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Game service isteği yarıda kesildi.",
                    exception
            );
        }
    }

    private String getExternalGamesCatalog(String authorization) {
        String catalogJson = getJson(
                "/api/games/external/apps",
                Map.of(
                        "source", "STEAM",
                        "page", "1",
                        "size", String.valueOf(EXTERNAL_CATALOG_SIZE)
                ),
                authorization
        );

        try {
            JsonNode root = objectMapper.readTree(catalogJson);
            JsonNode items = root.path("items");
            ArrayNode games = objectMapper.createArrayNode();

            if (!items.isArray()) {
                return games.toString();
            }

            for (JsonNode item : items) {
                String externalId = item.path("externalId").asText("");
                String title = item.path("title").asText("");

                if (externalId.isBlank() || title.isBlank()) {
                    continue;
                }

                ObjectNode game = games.addObject();
                game.put("id", parseNumericId(externalId));
                game.put("source", item.path("source").asText("STEAM"));
                game.putNull("categoryId");
                game.putNull("categoryName");
                game.put("title", title);
                game.putNull("description");
                game.putNull("genre");
                game.put("platform", "Steam");
                game.putNull("releaseDate");
                game.putNull("developer");
                game.putNull("publisher");
                game.putNull("minimumSystemRequirements");
                game.putNull("recommendedSystemRequirements");
                game.putNull("supportedLanguages");
                game.put("coverImageUrl", item.path("coverImageUrl").asText(""));
                game.put("earlyAccess", false);
                game.put("onSale", false);
                game.put("turkishLanguageSupport", false);
                game.put("popularityScore", 0);
                game.put("systemRequirementOnly", false);
                game.putNull("createdAt");
                game.putNull("updatedAt");
            }

            return games.toString();
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Game service fallback response could not be parsed.",
                    exception
            );
        }
    }

    private boolean isEmptyArray(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            return root.isArray() && root.isEmpty();
        } catch (IOException exception) {
            return false;
        }
    }

    private long parseNumericId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            return Math.abs(value.hashCode());
        }
    }

    private static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }

        return baseUrl;
    }

    private static String buildQuery(Map<String, String> queryParams) {
        String query = queryParams.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .map(entry ->
                        encode(entry.getKey()) + "=" + encode(entry.getValue())
                )
                .collect(Collectors.joining("&"));

        return query.isBlank() ? "" : "?" + query;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
