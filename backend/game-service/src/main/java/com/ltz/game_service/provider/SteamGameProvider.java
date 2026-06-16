package com.ltz.game_service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.steam.SteamAppDetailsResponse;
import com.ltz.game_service.dto.steam.SteamSearchResultsResponse;
import com.ltz.game_service.dto.steam.SteamStoreSearchResponse;
import com.ltz.game_service.enums.GameSource;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.text.Normalizer;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
public class SteamGameProvider implements ExternalGameProvider {

    private static final int SEARCH_RESULT_LIMIT = 20;

    private static final List<SteamCategory> STEAM_CATEGORIES = List.of(
            new SteamCategory(
                    "action",
                    "Aksiyon",
                    "Hızlı tempo, savaş, çatışma ve refleks odaklı Steam oyunları.",
                    "action"
            ),
            new SteamCategory(
                    "adventure",
                    "Macera",
                    "Keşif, hikaye anlatımı ve görev odaklı Steam oyunları.",
                    "adventure"
            ),
            new SteamCategory(
                    "rpg",
                    "RYO",
                    "Karakter geliştirme, rol yapma ve hikaye ilerleyişi sunan Steam oyunları.",
                    "rpg"
            ),
            new SteamCategory(
                    "strategy",
                    "Strateji",
                    "Planlama, kaynak yönetimi ve taktiksel kararlar içeren Steam oyunları.",
                    "strategy"
            ),
            new SteamCategory(
                    "simulation",
                    "Simülasyon",
                    "Gerçek hayat, araç, şehir, meslek veya sistem simülasyonu sunan Steam oyunları.",
                    "simulation"
            ),
            new SteamCategory(
                    "racing",
                    "Yarış",
                    "Araç kullanımı, hız ve yarış rekabeti üzerine kurulu Steam oyunları.",
                    "racing"
            ),
            new SteamCategory(
                    "sports",
                    "Spor",
                    "Futbol, basketbol, dövüş, fitness ve diğer spor temalı Steam oyunları.",
                    "sports"
            ),
            new SteamCategory(
                    "indie",
                    "Bağımsız",
                    "Bağımsız geliştiriciler tarafından yayınlanan yaratıcı Steam oyunları.",
                    "indie"
            ),
            new SteamCategory(
                    "horror",
                    "Korku",
                    "Gerilim, hayatta kalma korkusu ve atmosfer odaklı Steam oyunları.",
                    "horror"
            ),
            new SteamCategory(
                    "survival",
                    "Hayatta Kalma",
                    "Kaynak toplama, üretim ve zorlu koşullarda yaşam mücadelesi içeren Steam oyunları.",
                    "survival"
            ),
            new SteamCategory(
                    "open-world",
                    "Açık Dünya",
                    "Geniş haritalarda serbest keşif ve görev yapısı sunan Steam oyunları.",
                    "open world"
            ),
            new SteamCategory(
                    "multiplayer",
                    "Çok Oyunculu",
                    "Birden fazla oyuncuyla çevrim içi veya yerel oynanabilen Steam oyunları.",
                    "multiplayer"
            )
    );

    private final RestClient steamStoreClient;
    private final ObjectMapper objectMapper;

    public SteamGameProvider() {
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));

        this.steamStoreClient = RestClient.builder()
                .baseUrl("https://store.steampowered.com")
                .requestFactory(requestFactory)
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

    @Override
    public List<ExternalGameCategoryResponse> getCategories(String query) {
        return STEAM_CATEGORIES.stream()
                .filter(category -> matchesCategoryQuery(category, query))
                .map(category -> {
                    SteamCategoryStats stats = getSteamCategoryStats(category.searchTerm());

                    return new ExternalGameCategoryResponse(
                            GameSource.STEAM,
                            category.externalId(),
                            category.name(),
                            category.description(),
                            stats.gameCount(),
                            "ACTIVE",
                            "Steam Store API",
                            stats.imageUrl()
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public ExternalGamePlatformResponse getPlatformInfo() {
        return new ExternalGamePlatformResponse(
                GameSource.STEAM,
                "Steam",
                "Steam Store API üzerinden oyun, kategori ve platform verisi sağlayan aktif provider.",
                "ACTIVE",
                fetchSteamSearchTotalCount(""),
                null,
                2003,
                "Valve Corporation",
                "Steam Store API",
                null
        );
    }

    private SteamCategoryStats getSteamCategoryStats(String searchTerm) {
        SteamStoreSearchResponse searchResponse = fetchSteamStoreSearch(searchTerm);

        Integer gameCount = fetchSteamSearchTotalCount(searchTerm);
        String imageUrl = getFirstValidImageUrl(searchResponse);

        return new SteamCategoryStats(gameCount, imageUrl);
    }

    private Integer fetchSteamSearchTotalCount(String query) {
        try {
            String response = steamStoreClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search/results/")
                            .queryParam("term", query)
                            .queryParam("cc", "tr")
                            .queryParam("l", "turkish")
                            .queryParam("count", 0)
                            .queryParam("start", 0)
                            .queryParam("infinite", 1)
                            .build())
                    .retrieve()
                    .body(String.class);

            SteamSearchResultsResponse searchResultsResponse =
                    objectMapper.readValue(response, SteamSearchResultsResponse.class);

            if (searchResultsResponse == null || searchResultsResponse.getTotalCount() == null) {
                return 0;
            }

            return searchResultsResponse.getTotalCount();
        } catch (Exception e) {
            throw new RuntimeException("Steam toplam arama sonucu alınamadı. Query: " + query, e);
        }
    }

    private String getFirstValidImageUrl(SteamStoreSearchResponse searchResponse) {
        if (searchResponse == null || searchResponse.getItems() == null) {
            return null;
        }

        return searchResponse.getItems()
                .stream()
                .filter(item -> item.getId() != null)
                .filter(item -> item.getName() != null && !item.getName().isBlank())
                .map(item -> buildSteamHeaderImageUrl(item.getId()))
                .findFirst()
                .orElse(null);
    }

    private boolean matchesCategoryQuery(SteamCategory category, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }

        String normalizedQuery = normalizeText(query);

        return normalizeText(category.externalId()).contains(normalizedQuery)
                || normalizeText(category.name()).contains(normalizedQuery)
                || normalizeText(category.description()).contains(normalizedQuery)
                || normalizeText(category.searchTerm()).contains(normalizedQuery);
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
            return "Çok Yakında";
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

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("ı", "i")
                .replaceAll("\\s+", " ")
                .trim();
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

    private record SteamCategory(
            String externalId,
            String name,
            String description,
            String searchTerm
    ) {
    }

    private record SteamCategoryStats(
            Integer gameCount,
            String imageUrl
    ) {
    }
}