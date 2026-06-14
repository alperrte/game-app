package com.ltz.game_service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.steam.SteamAppDetailsResponse;
import com.ltz.game_service.dto.steam.SteamStoreSearchResponse;
import com.ltz.game_service.enums.GameSource;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
public class SteamGameProvider implements ExternalGameProvider {

    private static final int SEARCH_RESULT_LIMIT = 20;

    private final RestClient steamStoreClient;
    private final ObjectMapper objectMapper;

    public SteamGameProvider() {
        this.objectMapper = new ObjectMapper();

        this.steamStoreClient = RestClient.builder()
                .baseUrl("https://store.steampowered.com")
                .build();
    }

    @Override
    public GameSource getSource() {
        return GameSource.STEAM;
    }

    @Override
    public List<ExternalGameSearchResponse> searchGames(String query) {
        if (query == null || query.isBlank()) {
            throw new RuntimeException("Arama metni boş olamaz.");
        }

        SteamStoreSearchResponse searchResponse = fetchSteamStoreSearch(query);

        if (searchResponse == null || searchResponse.getItems() == null) {
            throw new RuntimeException("Steam arama sonucu alınamadı.");
        }

        return searchResponse.getItems()
                .stream()
                .filter(item -> item.getId() != null)
                .filter(item -> item.getName() != null && !item.getName().isBlank())
                .limit(SEARCH_RESULT_LIMIT)
                .map(item -> new ExternalGameSearchResponse(
                        GameSource.STEAM,
                        String.valueOf(item.getId()),
                        item.getName(),
                        item.getTinyImage() != null ? item.getTinyImage() : buildSteamHeaderImageUrl(item.getId())
                ))
                .collect(Collectors.toList());
    }

    @Override
    public ExternalGameDetailResponse getGameDetail(String externalId) {
        SteamAppDetailsResponse steamResponse = fetchSteamGameDetail(externalId);

        if (steamResponse == null || !steamResponse.isSuccess() || steamResponse.getData() == null) {
            throw new RuntimeException("Steam oyun detayı alınamadı. External ID: " + externalId);
        }

        SteamAppDetailsResponse.SteamGameData data = steamResponse.getData();

        return new ExternalGameDetailResponse(
                GameSource.STEAM,
                String.valueOf(data.getSteamAppId()),
                data.getName(),
                cleanHtml(data.getShortDescription()),
                mapGenres(data),
                mapPlatforms(data),
                mapReleaseDate(data),
                joinList(data.getDevelopers()),
                joinList(data.getPublishers()),
                data.getPcRequirements() != null ? cleanHtml(data.getPcRequirements().getMinimum()) : null,
                data.getPcRequirements() != null ? cleanHtml(data.getPcRequirements().getRecommended()) : null,
                cleanHtml(data.getSupportedLanguages()),
                data.getHeaderImage(),
                false,
                false,
                hasTurkishLanguage(data.getSupportedLanguages())
        );
    }

    private SteamStoreSearchResponse fetchSteamStoreSearch(String query) {
        try {
            String response = steamStoreClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/storesearch/")
                            .queryParam("term", query)
                            .queryParam("cc", "tr")
                            .queryParam("l", "turkish")
                            .build())
                    .retrieve()
                    .body(String.class);

            return objectMapper.readValue(response, SteamStoreSearchResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Steam store arama sonucu alınamadı.", e);
        }
    }

    private SteamAppDetailsResponse fetchSteamGameDetail(String externalId) {
        try {
            String response = steamStoreClient.get()
                    .uri("/api/appdetails?appids={appId}&cc=tr&l=turkish", externalId)
                    .retrieve()
                    .body(String.class);

            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode appNode = rootNode.get(externalId);

            if (appNode == null || appNode.isNull()) {
                throw new RuntimeException("Steam response içinde appId bulunamadı: " + externalId);
            }

            return objectMapper.treeToValue(appNode, SteamAppDetailsResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Steam API isteği başarısız oldu. External ID: " + externalId, e);
        }
    }

    private String mapGenres(SteamAppDetailsResponse.SteamGameData data) {
        if (data.getGenres() == null || data.getGenres().isEmpty()) {
            return null;
        }

        return data.getGenres()
                .stream()
                .map(SteamAppDetailsResponse.SteamGenre::getDescription)
                .collect(Collectors.joining(", "));
    }

    private String mapPlatforms(SteamAppDetailsResponse.SteamGameData data) {
        if (data.getPlatforms() == null) {
            return null;
        }

        StringBuilder platforms = new StringBuilder();

        if (data.getPlatforms().isWindows()) {
            platforms.append("Windows, ");
        }

        if (data.getPlatforms().isMac()) {
            platforms.append("Mac, ");
        }

        if (data.getPlatforms().isLinux()) {
            platforms.append("Linux, ");
        }

        if (platforms.isEmpty()) {
            return null;
        }

        return platforms.substring(0, platforms.length() - 2);
    }

    private String mapReleaseDate(SteamAppDetailsResponse.SteamGameData data) {
        if (data.getReleaseDate() == null) {
            return null;
        }

        if (data.getReleaseDate().isComingSoon()) {
            return "Coming Soon";
        }

        return data.getReleaseDate().getDate();
    }

    private String joinList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }

        return String.join(", ", values);
    }

    private boolean hasTurkishLanguage(String supportedLanguages) {
        if (supportedLanguages == null || supportedLanguages.isBlank()) {
            return false;
        }

        String cleaned = cleanHtml(supportedLanguages)
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");

        String normalized = Normalizer.normalize(cleaned, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return cleaned.contains("turkish")
                || cleaned.contains("türk")
                || cleaned.contains("türkçe")
                || cleaned.contains("turk")
                || cleaned.contains("turkce")
                || normalized.contains("turkish")
                || normalized.contains("turk")
                || normalized.contains("turkce");
    }

    private String buildSteamHeaderImageUrl(Integer appId) {
        return "https://cdn.cloudflare.steamstatic.com/steam/apps/" + appId + "/header.jpg";
    }

    private String cleanHtml(String value) {
        if (value == null) {
            return null;
        }

        return value
                .replaceAll("<[^>]*>", "")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .trim();
    }
}