package com.ltz.game_service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePageResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.response.external.ExternalGameTagResponse;
import com.ltz.game_service.dto.steam.SteamAppDetailsResponse;
import com.ltz.game_service.dto.steam.SteamSearchResultsResponse;
import com.ltz.game_service.dto.steam.SteamStoreSearchResponse;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.exception.ExternalGameContentBlockedException;
import com.ltz.game_service.exception.ExternalGameServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class SteamGameProvider implements ExternalGameProvider {

    private static final int SEARCH_RESULT_LIMIT = 20;
    private static final int POPULAR_GAME_LIMIT = 80;
    private static final int MAX_PAGE_SIZE = 50000;
    private static final int MAX_BACKGROUND_TAG_ENRICHMENT_ATTEMPTS = 120;
    private static final int INITIAL_TAG_ENRICHMENT_LIMIT = 60;
    private static final Duration STEAM_APP_LIST_CACHE_TTL = Duration.ofHours(6);
    private static final Duration STEAM_TAG_CACHE_TTL = Duration.ofHours(6);

    private static final List<String> BLOCKED_ADULT_TAG_KEYWORDS = List.of(
            "adult",
            "adults only",
            "hentai",
            "nsfw",
            "sexual",
            "sexual content",
            "nudity",
            "nude",
            "erotic",
            "sex",
            "porn",
            "pornography",
            "mature",
            "mature content",
            "dating sim",
            "visual novel",
            "anime sexual",
            "18+",
            "xxx"
    );

    private static final List<String> POPULAR_SEARCH_TERMS = List.of(
            "counter",
            "gta",
            "elden",
            "witcher",
            "cyberpunk",
            "red dead",
            "call of duty",
            "battlefield",
            "assassin",
            "resident evil",
            "god of war",
            "forza"
    );

    private static final Map<String, Integer> FALLBACK_TAG_IMAGE_APP_IDS = Map.ofEntries(
            Map.entry("action", 730),
            Map.entry("adventure", 367520),
            Map.entry("rpg", 1086940),
            Map.entry("role-playing", 1086940),
            Map.entry("strategy", 289070),
            Map.entry("simulation", 413150),
            Map.entry("racing", 244210),
            Map.entry("sports", 1811260),
            Map.entry("indie", 413150),
            Map.entry("horror", 381210),
            Map.entry("survival", 252490),
            Map.entry("open-world", 1174180),
            Map.entry("multiplayer", 730),
            Map.entry("co-op", 632360),
            Map.entry("online-co-op", 632360),
            Map.entry("singleplayer", 1245620),
            Map.entry("fps", 730),
            Map.entry("shooter", 730),
            Map.entry("third-person-shooter", 1174180),
            Map.entry("battle-royale", 578080),
            Map.entry("moba", 570),
            Map.entry("fighting", 389730),
            Map.entry("2d", 813780),
            Map.entry("3d", 3513350),
            Map.entry("platformer", 367520),
            Map.entry("2d-platformer", 2114740),
            Map.entry("puzzle", 620),
            Map.entry("roguelike", 646570),
            Map.entry("roguelite", 632360),
            Map.entry("souls-like", 1245620),
            Map.entry("action-rpg", 2694490),
            Map.entry("action-adventure", 3768760),
            Map.entry("anime", 582010),
            Map.entry("casual", 413150),
            Map.entry("fantasy", 1245620),
            Map.entry("sci-fi", 553850),
            Map.entry("mmorpg", 306130),
            Map.entry("city-builder", 255710),
            Map.entry("colony-sim", 294100),
            Map.entry("turn-based", 289070),
            Map.entry("turn-based-strategy", 289070),
            Map.entry("card-game", 646570),
            Map.entry("deckbuilding", 646570),
            Map.entry("sandbox", 4000),
            Map.entry("crafting", 252490),
            Map.entry("building", 252490),
            Map.entry("space", 359320),
            Map.entry("war", 394360),
            Map.entry("military", 394360),
            Map.entry("historical", 221380),
            Map.entry("economy", 255710),
            Map.entry("management", 255710),
            Map.entry("automation", 526870),
            Map.entry("farming", 413150),
            Map.entry("life-sim", 413150),
            Map.entry("crime", 271590),
            Map.entry("driving", 244210),
            Map.entry("football", 1811260),
            Map.entry("basketball", 1644960),
            Map.entry("vr", 546560)
    );

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
    private final RestClient steamApiClient;
    private final ObjectMapper objectMapper;
    private final String steamApiKey;

    private List<ExternalGameSearchResponse> cachedSteamAppList = List.of();
    private Instant cachedSteamAppListExpiresAt = Instant.EPOCH;

    private List<ExternalGameTagResponse> cachedSteamTags = List.of();
    private Instant cachedSteamTagsExpiresAt = Instant.EPOCH;
    private boolean steamTagEnrichmentRunning = false;

    public SteamGameProvider(@Value("${steam.api.key:}") String steamApiKey) {
        this.objectMapper = new ObjectMapper();
        this.steamApiKey = steamApiKey;

        SimpleClientHttpRequestFactory storeRequestFactory = new SimpleClientHttpRequestFactory();
        storeRequestFactory.setConnectTimeout(Duration.ofSeconds(3));
        storeRequestFactory.setReadTimeout(Duration.ofSeconds(10));

        SimpleClientHttpRequestFactory steamApiRequestFactory = new SimpleClientHttpRequestFactory();
        steamApiRequestFactory.setConnectTimeout(Duration.ofSeconds(5));
        steamApiRequestFactory.setReadTimeout(Duration.ofSeconds(45));

        this.steamStoreClient = RestClient.builder()
                .baseUrl("https://store.steampowered.com")
                .requestFactory(storeRequestFactory)
                .build();

        this.steamApiClient = RestClient.builder()
                .baseUrl("https://api.steampowered.com")
                .requestFactory(steamApiRequestFactory)
                .build();
    }

    @Override
    public GameSource getSource() {
        return GameSource.STEAM;
    }

    @Override
    public List<ExternalGameSearchResponse> searchGames(String query) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Arama metni boş olamaz.");
        }

        SteamStoreSearchResponse searchResponse = fetchSteamStoreSearch(query);

        if (searchResponse == null || searchResponse.getItems() == null) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
        }

        return searchResponse.getItems()
                .stream()
                .filter(item -> item.getId() != null)
                .filter(item -> item.getName() != null && !item.getName().isBlank())
                .filter(item -> !isBlockedAdultGameTitle(item.getName()))
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
    public List<ExternalGameSearchResponse> getPopularGames() {
        return POPULAR_SEARCH_TERMS.stream()
                .flatMap(searchTerm -> searchGames(searchTerm).stream())
                .collect(Collectors.toMap(
                        ExternalGameSearchResponse::getExternalId,
                        game -> game,
                        (existingGame, duplicateGame) -> existingGame,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .limit(POPULAR_GAME_LIMIT)
                .collect(Collectors.toList());
    }

    @Override
    public ExternalGamePageResponse getGames(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        List<ExternalGameSearchResponse> allGames = getCachedSteamAppList();

        int totalItems = allGames.size();
        int totalPages = totalItems == 0
                ? 0
                : (int) Math.ceil((double) totalItems / safeSize);

        int fromIndex = (safePage - 1) * safeSize;

        if (fromIndex >= totalItems) {
            return new ExternalGamePageResponse(
                    List.of(),
                    safePage,
                    safeSize,
                    totalItems,
                    totalPages
            );
        }

        int toIndex = Math.min(fromIndex + safeSize, totalItems);

        return new ExternalGamePageResponse(
                allGames.subList(fromIndex, toIndex),
                safePage,
                safeSize,
                totalItems,
                totalPages
        );
    }

    @Override
    public ExternalGamePageResponse getGames(int page, int size, String tag) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        if (tag == null || tag.isBlank()) {
            return getGames(safePage, safeSize);
        }

        if (isBlockedAdultTag(tag)) {
            return new ExternalGamePageResponse(
                    List.of(),
                    safePage,
                    safeSize,
                    0,
                    0
            );
        }

        return fetchSteamGamesByTag(tag, safePage, safeSize);
    }

    @Override
    public ExternalGameDetailResponse getGameDetail(String externalId) {
        SteamAppDetailsResponse steamResponse = fetchSteamGameDetail(externalId);

        if (steamResponse == null || !steamResponse.isSuccess() || steamResponse.getData() == null) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
        }

        SteamAppDetailsResponse.SteamGameData data = steamResponse.getData();

        if (isBlockedAdultGameTitle(data.getName())) {
            throw new ExternalGameContentBlockedException();
        }

        return new ExternalGameDetailResponse(
                GameSource.STEAM,
                String.valueOf(data.getSteamAppId()),
                data.getName(),
                cleanHtml(data.getShortDescription()),
                mapGenres(data),
                mapPlatforms(data),
                mapReleaseDate(data),
                joinList(data.getDevelopers()),
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
                .filter(category -> !isBlockedAdultTag(category.externalId()))
                .filter(category -> !isBlockedAdultTag(category.name()))
                .filter(category -> !isBlockedAdultTag(category.searchTerm()))
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
    public List<ExternalGameTagResponse> getTags() {
        return getCachedSteamTags();
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

    @Override
    public List<ExternalGameSearchResponse> getImportCandidates() {
        Map<String, ExternalGameSearchResponse> candidates = new LinkedHashMap<>();

        // Önce popüler oyunlar (öncelikli), sonra tüm app listesi (geniş kapsam)
        try {
            for (ExternalGameSearchResponse popular : getPopularGames()) {
                if (popular.getExternalId() != null && !popular.getExternalId().isBlank()) {
                    candidates.putIfAbsent(popular.getExternalId(), popular);
                }
            }
        } catch (Exception ignored) {
            // Popüler liste alınamazsa app listesiyle devam edilir.
        }

        try {
            for (ExternalGameSearchResponse app : getCachedSteamAppList()) {
                if (app.getExternalId() != null && !app.getExternalId().isBlank()) {
                    candidates.putIfAbsent(app.getExternalId(), app);
                }
            }
        } catch (Exception ignored) {
            // App listesi alınamazsa eldeki adaylarla devam edilir.
        }

        return new ArrayList<>(candidates.values());
    }

    @Override
    public ExternalGameImportData fetchImportData(String externalId) {
        SteamAppDetailsResponse steamResponse = fetchSteamGameDetail(externalId);

        if (steamResponse == null || !steamResponse.isSuccess() || steamResponse.getData() == null) {
            return null;
        }

        SteamAppDetailsResponse.SteamGameData data = steamResponse.getData();

        if (isBlockedAdultGameTitle(data.getName())) {
            return null;
        }

        Integer priceFinal = null;
        Integer priceInitial = null;
        Integer discountPercent = null;
        String currency = null;

        if (data.getPriceOverview() != null) {
            priceFinal = data.getPriceOverview().getFinalPrice();
            priceInitial = data.getPriceOverview().getInitial();
            discountPercent = data.getPriceOverview().getDiscountPercent();
            currency = data.getPriceOverview().getCurrency();
        }

        boolean onSale = discountPercent != null && discountPercent > 0;

        ExternalGameDetailResponse detail = new ExternalGameDetailResponse(
                GameSource.STEAM,
                String.valueOf(data.getSteamAppId()),
                data.getName(),
                cleanHtml(data.getShortDescription()),
                mapGenres(data),
                mapPlatforms(data),
                mapReleaseDate(data),
                joinList(data.getDevelopers()),
                data.getPcRequirements() != null ? cleanHtml(data.getPcRequirements().getMinimum()) : null,
                data.getPcRequirements() != null ? cleanHtml(data.getPcRequirements().getRecommended()) : null,
                cleanHtml(data.getSupportedLanguages()),
                data.getHeaderImage(),
                false,
                onSale,
                hasTurkishLanguage(data.getSupportedLanguages())
        );

        return new ExternalGameImportData(
                detail,
                data.getType(),
                data.isFree(),
                priceFinal,
                priceInitial,
                currency,
                discountPercent,
                buildSteamStoreUrl(data.getSteamAppId())
        );
    }

    private synchronized List<ExternalGameSearchResponse> getCachedSteamAppList() {
        Instant now = Instant.now();

        if (!cachedSteamAppList.isEmpty() && now.isBefore(cachedSteamAppListExpiresAt)) {
            return cachedSteamAppList;
        }

        cachedSteamAppList = fetchSteamAppList();
        cachedSteamAppListExpiresAt = now.plus(STEAM_APP_LIST_CACHE_TTL);

        return cachedSteamAppList;
    }

    private synchronized List<ExternalGameTagResponse> getCachedSteamTags() {
        Instant now = Instant.now();

        if (!cachedSteamTags.isEmpty() && now.isBefore(cachedSteamTagsExpiresAt)) {
            return cachedSteamTags;
        }

        List<ExternalGameTagResponse> fastTags = fetchSteamTags(false);

        cachedSteamTags = fastTags;
        cachedSteamTagsExpiresAt = now.plus(STEAM_TAG_CACHE_TTL);

        triggerSteamTagBackgroundEnrichment();

        return cachedSteamTags;
    }

    private void triggerSteamTagBackgroundEnrichment() {
        synchronized (this) {
            if (steamTagEnrichmentRunning) {
                return;
            }

            steamTagEnrichmentRunning = true;
        }

        CompletableFuture.runAsync(() -> {
            try {
                List<ExternalGameTagResponse> enrichedTags = fetchSteamTags(true);

                synchronized (this) {
                    if (!enrichedTags.isEmpty()) {
                        cachedSteamTags = mergeEnrichedSteamTags(cachedSteamTags, enrichedTags);
                        cachedSteamTagsExpiresAt = Instant.now().plus(STEAM_TAG_CACHE_TTL);
                    }
                }
            } catch (Exception ignored) {
                // İlk hızlı sonuç cache'e yazıldığı için arka plan hatası kullanıcıyı bozmaz.
            } finally {
                synchronized (this) {
                    steamTagEnrichmentRunning = false;
                }
            }
        });
    }

    private List<ExternalGameTagResponse> mergeEnrichedSteamTags(
            List<ExternalGameTagResponse> currentTags,
            List<ExternalGameTagResponse> enrichedTags
    ) {
        Map<String, ExternalGameTagResponse> currentTagsById = currentTags.stream()
                .collect(Collectors.toMap(
                        ExternalGameTagResponse::getExternalId,
                        tag -> tag,
                        (existingTag, duplicateTag) -> existingTag,
                        LinkedHashMap::new
                ));

        for (ExternalGameTagResponse enrichedTag : enrichedTags) {
            if (isBlockedAdultTag(enrichedTag.getName()) || isBlockedAdultTag(enrichedTag.getExternalId())) {
                continue;
            }

            ExternalGameTagResponse currentTag = currentTagsById.get(enrichedTag.getExternalId());

            if (currentTag == null) {
                currentTagsById.put(enrichedTag.getExternalId(), enrichedTag);
                continue;
            }

            Integer resolvedGameCount =
                    enrichedTag.getGameCount() != null && enrichedTag.getGameCount() > 0
                            ? enrichedTag.getGameCount()
                            : currentTag.getGameCount();

            String resolvedImageUrl =
                    enrichedTag.getImageUrl() != null && !enrichedTag.getImageUrl().isBlank()
                            ? enrichedTag.getImageUrl()
                            : currentTag.getImageUrl();

            currentTagsById.put(
                    enrichedTag.getExternalId(),
                    new ExternalGameTagResponse(
                            currentTag.getSource(),
                            currentTag.getExternalId(),
                            currentTag.getName(),
                            currentTag.getDescription(),
                            resolvedGameCount,
                            currentTag.getStatus(),
                            currentTag.getSourceProvider(),
                            resolvedImageUrl
                    )
            );
        }

        return sortAndDeduplicateTags(new ArrayList<>(currentTagsById.values()));
    }

    private List<ExternalGameSearchResponse> fetchSteamAppList() {
        try {
            if (steamApiKey == null || steamApiKey.isBlank()) {
                throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
            }

            String response = steamApiClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/IStoreService/GetAppList/v1/")
                            .queryParam("key", steamApiKey)
                            .queryParam("include_games", true)
                            .queryParam("max_results", 50000)
                            .build())
                    .retrieve()
                    .body(String.class);

            JsonNode appsNode = objectMapper.readTree(response)
                    .path("response")
                    .path("apps");

            if (!appsNode.isArray()) {
                throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
            }

            List<ExternalGameSearchResponse> games = new ArrayList<>();

            for (JsonNode appNode : appsNode) {
                JsonNode appIdNode = appNode.get("appid");
                JsonNode nameNode = appNode.get("name");

                if (appIdNode == null || nameNode == null) {
                    continue;
                }

                String externalId = appIdNode.asText();
                String title = nameNode.asText();

                if (externalId == null || externalId.isBlank() || title == null || title.isBlank()) {
                    continue;
                }

                if (isBlockedAdultGameTitle(title)) {
                    continue;
                }

                games.add(new ExternalGameSearchResponse(
                        GameSource.STEAM,
                        externalId,
                        title,
                        buildSteamHeaderImageUrl(Integer.parseInt(externalId))
                ));
            }

            return games.stream()
                    .collect(Collectors.toMap(
                            ExternalGameSearchResponse::getExternalId,
                            game -> game,
                            (existingGame, duplicateGame) -> existingGame,
                            LinkedHashMap::new
                    ))
                    .values()
                    .stream()
                    .sorted(Comparator.comparing(
                            game -> normalizeText(game.getTitle()),
                            Comparator.nullsLast(String::compareTo)
                    ))
                    .collect(Collectors.toList());
        } catch (ExternalGameServiceUnavailableException exception) {
            if (!cachedSteamAppList.isEmpty()) {
                return cachedSteamAppList;
            }

            throw exception;
        } catch (Exception exception) {
            if (!cachedSteamAppList.isEmpty()) {
                return cachedSteamAppList;
            }

            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
        }
    }

    private ExternalGamePageResponse fetchSteamGamesByTag(String tag, int page, int size) {
        String normalizedTag = tag.trim();
        int start = Math.max(0, (page - 1) * size);

        if (isBlockedAdultTag(normalizedTag)) {
            return new ExternalGamePageResponse(
                    List.of(),
                    page,
                    size,
                    0,
                    0
            );
        }

        SteamTagSearchParam tagSearchParam = resolveSteamTagSearchParam(normalizedTag);

        try {
            String response = steamStoreClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path("/search/results/")
                                .queryParam("cc", "tr")
                                .queryParam("l", "turkish")
                                .queryParam("count", size)
                                .queryParam("start", start)
                                .queryParam("infinite", 1);

                        if ("tags".equals(tagSearchParam.paramName())) {
                            builder.queryParam("tags", tagSearchParam.paramValue());
                        } else {
                            builder.queryParam("term", tagSearchParam.paramValue());
                        }

                        return builder.build();
                    })
                    .retrieve()
                    .body(String.class);

            JsonNode rootNode = objectMapper.readTree(response);

            Integer totalCount = readOptionalInt(
                    rootNode,
                    "total_count",
                    "totalCount",
                    "count"
            );

            String resultsHtml = rootNode.path("results_html").asText(null);
            List<ExternalGameSearchResponse> games = parseSteamSearchResultsHtml(resultsHtml);

            int totalItems = totalCount != null && totalCount > 0 ? totalCount : games.size();
            int totalPages = totalItems == 0
                    ? 0
                    : (int) Math.ceil((double) totalItems / size);

            return new ExternalGamePageResponse(
                    games,
                    page,
                    size,
                    totalItems,
                    totalPages
            );
        } catch (Exception exception) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
        }
    }

    private SteamTagSearchParam resolveSteamTagSearchParam(String tag) {
        String normalizedSelectedTag = normalizeText(tag);

        try {
            return getCachedSteamTags()
                    .stream()
                    .filter(steamTag ->
                            normalizeText(steamTag.getName()).equals(normalizedSelectedTag)
                                    || normalizeText(steamTag.getExternalId()).equals(normalizedSelectedTag)
                    )
                    .filter(steamTag -> steamTag.getExternalId() != null && !steamTag.getExternalId().isBlank())
                    .filter(steamTag -> !isBlockedAdultTag(steamTag.getName()))
                    .filter(steamTag -> !isBlockedAdultTag(steamTag.getExternalId()))
                    .filter(steamTag -> isNumeric(steamTag.getExternalId()))
                    .findFirst()
                    .map(steamTag -> new SteamTagSearchParam("tags", steamTag.getExternalId()))
                    .orElseGet(() -> new SteamTagSearchParam("term", tag));
        } catch (Exception exception) {
            return new SteamTagSearchParam("term", tag);
        }
    }

    private List<ExternalGameSearchResponse> parseSteamSearchResultsHtml(String html) {
        if (html == null || html.isBlank()) {
            return List.of();
        }

        Pattern resultPattern = Pattern.compile(
                "(?is)<a[^>]*href=\"https://store\\.steampowered\\.com/app/(\\d+)/[^\"]*\"[^>]*>(.*?)</a>"
        );

        Matcher matcher = resultPattern.matcher(html);
        Map<String, ExternalGameSearchResponse> gamesByExternalId = new LinkedHashMap<>();

        while (matcher.find()) {
            String externalId = matcher.group(1);
            String resultHtml = matcher.group(2);
            String title = extractSteamSearchResultTitle(resultHtml);

            if (externalId == null || externalId.isBlank() || title == null || title.isBlank()) {
                continue;
            }

            if (isBlockedAdultGameTitle(title)) {
                continue;
            }

            gamesByExternalId.putIfAbsent(
                    externalId,
                    new ExternalGameSearchResponse(
                            GameSource.STEAM,
                            externalId,
                            title,
                            buildSteamHeaderImageUrl(Integer.parseInt(externalId))
                    )
            );
        }

        return new ArrayList<>(gamesByExternalId.values());
    }

    private String extractSteamSearchResultTitle(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }

        Pattern titlePattern = Pattern.compile(
                "(?is)<span[^>]*class=\"[^\"]*title[^\"]*\"[^>]*>(.*?)</span>"
        );

        Matcher titleMatcher = titlePattern.matcher(html);

        if (titleMatcher.find()) {
            return cleanHtml(titleMatcher.group(1));
        }

        return null;
    }

    private List<ExternalGameTagResponse> fetchSteamTags(boolean allowBackgroundEnrichment) {
        try {
            String response = steamStoreClient.get()
                    .uri("/tagdata/populartags/english")
                    .retrieve()
                    .body(String.class);

            JsonNode tagsNode = objectMapper.readTree(response);

            if (tagsNode.isArray()) {
                List<ExternalGameTagResponse> tags = new ArrayList<>();

                for (JsonNode tagNode : tagsNode) {
                    String name = tagNode.path("name").asText(null);

                    if (name == null || name.isBlank()) {
                        continue;
                    }

                    JsonNode tagIdNode = tagNode.get("tagid");

                    String externalId = tagIdNode != null && !tagIdNode.isNull()
                            ? tagIdNode.asText()
                            : slugify(name);

                    if (isBlockedAdultTag(name) || isBlockedAdultTag(externalId)) {
                        continue;
                    }

                    Integer gameCount = readOptionalInt(
                            tagNode,
                            "count",
                            "total_count",
                            "totalCount",
                            "tag_count",
                            "tagCount"
                    );

                    boolean shouldEnrich =
                            tags.size() < INITIAL_TAG_ENRICHMENT_LIMIT
                                    || (allowBackgroundEnrichment
                                    && tags.size() < MAX_BACKGROUND_TAG_ENRICHMENT_ATTEMPTS);

                    tags.add(buildSteamTagResponse(
                            externalId,
                            name,
                            gameCount,
                            shouldEnrich,
                            "Steam Store tarafından sağlanan gerçek Steam etiketi."
                    ));
                }

                if (!tags.isEmpty()) {
                    return sortAndDeduplicateTags(tags);
                }
            }

            return fetchSteamTagsFromBrowsePage(allowBackgroundEnrichment);
        } catch (Exception tagDataError) {
            return fetchSteamTagsFromBrowsePage(allowBackgroundEnrichment);
        }
    }

    private List<ExternalGameTagResponse> fetchSteamTagsFromBrowsePage(boolean allowBackgroundEnrichment) {
        try {
            String html = steamStoreClient.get()
                    .uri("/tag/browse/?l=english")
                    .retrieve()
                    .body(String.class);

            Pattern tagLinkPattern = Pattern.compile(
                    "(?is)<a[^>]*href\\s*=\\s*\"[^\"]*/tags/[^/]+/([^\"/]+)/?\"[^>]*>(.*?)</a>"
            );

            Matcher matcher = tagLinkPattern.matcher(html);
            Map<String, ExternalGameTagResponse> tagsByExternalId = new LinkedHashMap<>();

            while (matcher.find()) {
                String rawTagValue = decodeUrlValue(matcher.group(1));
                String visibleName = cleanHtml(matcher.group(2));

                String name = visibleName != null && !visibleName.isBlank()
                        ? visibleName
                        : rawTagValue;

                if (name == null || name.isBlank()) {
                    continue;
                }

                String externalId = slugify(rawTagValue);

                if (isBlockedAdultTag(name)
                        || isBlockedAdultTag(externalId)
                        || isBlockedAdultTag(rawTagValue)) {
                    continue;
                }

                boolean shouldEnrich =
                        tagsByExternalId.size() < INITIAL_TAG_ENRICHMENT_LIMIT
                                || (allowBackgroundEnrichment
                                && tagsByExternalId.size() < MAX_BACKGROUND_TAG_ENRICHMENT_ATTEMPTS);

                ExternalGameTagResponse tagResponse = buildSteamTagResponse(
                        externalId,
                        name,
                        null,
                        shouldEnrich,
                        "Steam Store tag sayfasından alınan gerçek Steam etiketi."
                );

                tagsByExternalId.putIfAbsent(externalId, tagResponse);
            }

            if (tagsByExternalId.isEmpty()) {
                throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
            }

            return sortAndDeduplicateTags(new ArrayList<>(tagsByExternalId.values()));
        } catch (ExternalGameServiceUnavailableException exception) {
            if (!cachedSteamTags.isEmpty()) {
                return cachedSteamTags;
            }

            throw exception;
        } catch (Exception exception) {
            if (!cachedSteamTags.isEmpty()) {
                return cachedSteamTags;
            }

            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
        }
    }

    private List<ExternalGameTagResponse> sortAndDeduplicateTags(List<ExternalGameTagResponse> tags) {
        return tags.stream()
                .filter(tag -> !isBlockedAdultTag(tag.getName()))
                .filter(tag -> !isBlockedAdultTag(tag.getExternalId()))
                .collect(Collectors.toMap(
                        ExternalGameTagResponse::getExternalId,
                        tag -> tag,
                        (existingTag, duplicateTag) -> existingTag,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted(
                        Comparator.comparing(
                                        (ExternalGameTagResponse tag) -> hasImage(tag)
                                )
                                .reversed()
                                .thenComparing(
                                        Comparator.comparing(
                                                        (ExternalGameTagResponse tag) -> hasGameCount(tag)
                                                )
                                                .reversed()
                                )
                                .thenComparing(
                                        Comparator.comparing(
                                                        (ExternalGameTagResponse tag) -> tag.getGameCount() == null
                                                                ? 0
                                                                : tag.getGameCount()
                                                )
                                                .reversed()
                                )
                                .thenComparing(
                                        tag -> normalizeText(tag.getName()),
                                        Comparator.nullsLast(String::compareTo)
                                )
                )
                .collect(Collectors.toList());
    }

    private ExternalGameTagResponse buildSteamTagResponse(
            String externalId,
            String name,
            Integer gameCount,
            boolean shouldEnrich,
            String description
    ) {
        SteamCategoryStats stats = shouldEnrich
                ? getSteamTagStats(externalId, name)
                : new SteamCategoryStats(null, null);

        Integer resolvedGameCount = gameCount != null && gameCount > 0
                ? gameCount
                : stats.gameCount();

        String imageUrl = stats.imageUrl() != null && !stats.imageUrl().isBlank()
                ? stats.imageUrl()
                : getFallbackTagImageUrl(name);

        return new ExternalGameTagResponse(
                GameSource.STEAM,
                externalId,
                name,
                description,
                resolvedGameCount != null && resolvedGameCount > 0 ? resolvedGameCount : null,
                "ACTIVE",
                "Steam Store Tags",
                imageUrl
        );
    }

    private SteamCategoryStats getSteamTagStats(String externalId, String tagName) {
        SteamCategoryStats tagIdStats = isNumeric(externalId)
                ? fetchSteamTagSearchStats("tags", externalId)
                : new SteamCategoryStats(null, null);

        if (tagIdStats.gameCount() != null
                && tagIdStats.gameCount() > 0
                && tagIdStats.imageUrl() != null
                && !tagIdStats.imageUrl().isBlank()) {
            return tagIdStats;
        }

        SteamCategoryStats termStats = fetchSteamTagSearchStats("term", tagName);

        Integer resolvedGameCount = termStats.gameCount() != null && termStats.gameCount() > 0
                ? termStats.gameCount()
                : tagIdStats.gameCount();

        String resolvedImageUrl = termStats.imageUrl() != null && !termStats.imageUrl().isBlank()
                ? termStats.imageUrl()
                : tagIdStats.imageUrl();

        if (resolvedGameCount != null || resolvedImageUrl != null) {
            return new SteamCategoryStats(resolvedGameCount, resolvedImageUrl);
        }

        try {
            return getSteamCategoryStats(tagName);
        } catch (Exception fallbackError) {
            return new SteamCategoryStats(null, null);
        }
    }

    private SteamCategoryStats fetchSteamTagSearchStats(String paramName, String paramValue) {
        if (paramValue == null || paramValue.isBlank()) {
            return new SteamCategoryStats(null, null);
        }

        try {
            String response = steamStoreClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search/results/")
                            .queryParam("cc", "tr")
                            .queryParam("l", "turkish")
                            .queryParam("count", 1)
                            .queryParam("start", 0)
                            .queryParam("infinite", 1)
                            .queryParam(paramName, paramValue)
                            .build())
                    .retrieve()
                    .body(String.class);

            JsonNode rootNode = objectMapper.readTree(response);

            Integer gameCount = readOptionalInt(
                    rootNode,
                    "total_count",
                    "totalCount",
                    "count"
            );

            if (gameCount != null && gameCount <= 0) {
                gameCount = null;
            }

            String resultsHtml = rootNode.path("results_html").asText(null);
            String imageUrl = extractFirstSteamHeaderImageUrl(resultsHtml);

            return new SteamCategoryStats(gameCount, imageUrl);
        } catch (Exception exception) {
            return new SteamCategoryStats(null, null);
        }
    }

    private Integer readOptionalInt(JsonNode node, String... fieldNames) {
        if (node == null || node.isNull()) {
            return null;
        }

        for (String fieldName : fieldNames) {
            JsonNode valueNode = node.get(fieldName);

            if (valueNode == null || valueNode.isNull()) {
                continue;
            }

            if (valueNode.isNumber()) {
                return valueNode.asInt();
            }

            if (valueNode.isTextual()) {
                String value = valueNode.asText()
                        .replace(",", "")
                        .replace(".", "")
                        .trim();

                if (value.matches("\\d+")) {
                    return Integer.parseInt(value);
                }
            }
        }

        return null;
    }

    private String extractFirstSteamHeaderImageUrl(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }

        Pattern dataAppIdPattern = Pattern.compile("data-ds-appid=\"(\\d+)\"");
        Matcher dataAppIdMatcher = dataAppIdPattern.matcher(html);

        if (dataAppIdMatcher.find()) {
            return buildSteamHeaderImageUrl(Integer.parseInt(dataAppIdMatcher.group(1)));
        }

        Pattern appUrlPattern = Pattern.compile("/app/(\\d+)/");
        Matcher appUrlMatcher = appUrlPattern.matcher(html);

        if (appUrlMatcher.find()) {
            return buildSteamHeaderImageUrl(Integer.parseInt(appUrlMatcher.group(1)));
        }

        Pattern imagePattern = Pattern.compile(
                "https://[^\"']*/steam/apps/(\\d+)/[^\"']*?\\.jpg"
        );
        Matcher imageMatcher = imagePattern.matcher(html);

        if (imageMatcher.find()) {
            return buildSteamHeaderImageUrl(Integer.parseInt(imageMatcher.group(1)));
        }

        return null;
    }

    private String getFallbackTagImageUrl(String tagName) {
        if (tagName == null || tagName.isBlank()) {
            return null;
        }

        Integer appId = FALLBACK_TAG_IMAGE_APP_IDS.get(slugify(tagName));

        if (appId == null) {
            return null;
        }

        return buildSteamHeaderImageUrl(appId);
    }

    private boolean hasImage(ExternalGameTagResponse tag) {
        return tag != null
                && tag.getImageUrl() != null
                && !tag.getImageUrl().isBlank();
    }

    private boolean hasGameCount(ExternalGameTagResponse tag) {
        return tag != null
                && tag.getGameCount() != null
                && tag.getGameCount() > 0;
    }

    private boolean isBlockedAdultTag(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalizedValue = normalizeText(value);

        return BLOCKED_ADULT_TAG_KEYWORDS.stream()
                .anyMatch(keyword -> normalizedValue.contains(normalizeText(keyword)));
    }

    private boolean isBlockedAdultGameTitle(String title) {
        return isBlockedAdultTag(title);
    }

    private boolean isNumeric(String value) {
        return value != null && value.matches("\\d+");
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
                return null;
            }

            Integer totalCount = searchResultsResponse.getTotalCount();

            return totalCount != null && totalCount > 0 ? totalCount : null;
        } catch (Exception exception) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
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
                .filter(item -> !isBlockedAdultGameTitle(item.getName()))
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
        } catch (Exception exception) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
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
                throw new ExternalGameServiceUnavailableException(GameSource.STEAM, null);
            }

            return objectMapper.treeToValue(appNode, SteamAppDetailsResponse.class);
        } catch (ExternalGameServiceUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ExternalGameServiceUnavailableException(GameSource.STEAM, exception);
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

    private String slugify(String value) {
        return normalizeText(value)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String decodeUrlValue(String value) {
        if (value == null) {
            return "";
        }

        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (Exception exception) {
            return value;
        }
    }

    private String buildSteamHeaderImageUrl(Integer appId) {
        return "https://cdn.cloudflare.steamstatic.com/steam/apps/" + appId + "/header.jpg";
    }

    private String buildSteamStoreUrl(Integer appId) {
        return "https://store.steampowered.com/app/" + appId;
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

    private record SteamTagSearchParam(
            String paramName,
            String paramValue
    ) {
    }
}