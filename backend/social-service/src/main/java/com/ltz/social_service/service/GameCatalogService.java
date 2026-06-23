package com.ltz.social_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ltz.social_service.client.GameServiceClient;
import com.ltz.social_service.config.properties.GameServiceClientProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GameCatalogService {

    private final GameServiceClient gameServiceClient;
    private final GameServiceClientProperties properties;
    private final ObjectMapper objectMapper;

    public String getGames(Map<String, String> queryParams, String authorization) {
        String gamesJson = gameServiceClient.getGames(queryParams, authorization);

        if (!isEmptyArray(gamesJson)) {
            return gamesJson;
        }

        return getExternalGamesCatalog(authorization);
    }

    public String getPlatforms(String authorization) {
        return gameServiceClient.getPlatforms(authorization);
    }

    private String getExternalGamesCatalog(String authorization) {
        String catalogJson = gameServiceClient.getExternalGames(authorization);

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
                game.put("source", item.path("source").asText(properties.externalSource()));
                game.putNull("categoryId");
                game.putNull("categoryName");
                game.put("title", title);
                game.putNull("description");
                game.putNull("genre");
                game.put("platform", properties.fallbackPlatform());
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
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Game service fallback yanıtı ayrıştırılamadı.",
                    exception
            );
        }
    }

    private boolean isEmptyArray(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            return root.isArray() && root.isEmpty();
        } catch (JsonProcessingException exception) {
            return false;
        }
    }

    private long parseNumericId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            return Math.abs((long) value.hashCode());
        }
    }
}
