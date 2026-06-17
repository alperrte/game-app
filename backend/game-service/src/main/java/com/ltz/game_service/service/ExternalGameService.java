package com.ltz.game_service.service;

import com.ltz.game_service.config.CacheConfig;
import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePageResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.response.external.ExternalGameTagResponse;
import com.ltz.game_service.enums.GameSource;
import com.ltz.game_service.provider.ExternalGameProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExternalGameService {

    private static final List<String> BLOCKED_ADULT_CONTENT_KEYWORDS = List.of(
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

    private final Map<GameSource, ExternalGameProvider> providers;

    public ExternalGameService(List<ExternalGameProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(
                        ExternalGameProvider::getSource,
                        provider -> provider
                ));
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_SEARCH,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + (#query == null ? '' : #query.trim().toLowerCase())",
            unless = "#result == null"
    )
    public List<ExternalGameSearchResponse> search(GameSource source, String query) {
        return getProvider(source).searchGames(query)
                .stream()
                .filter(game -> !isBlockedAdultContent(game.getTitle()))
                .collect(Collectors.toList());
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_POPULAR,
            key = "T(java.lang.String).valueOf(#source).toLowerCase()",
            unless = "#result == null"
    )
    public List<ExternalGameSearchResponse> getPopularGames(GameSource source) {
        return getProvider(source).getPopularGames()
                .stream()
                .filter(game -> !isBlockedAdultContent(game.getTitle()))
                .collect(Collectors.toList());
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_APPS,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + #page + ':' + #size",
            unless = "#result == null"
    )
    public ExternalGamePageResponse getGames(GameSource source, int page, int size) {
        return getProvider(source).getGames(page, size);
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_APPS,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + #page + ':' + #size + ':' + (#tag == null ? '' : #tag.trim().toLowerCase())",
            unless = "#result == null"
    )
    public ExternalGamePageResponse getGames(GameSource source, int page, int size, String tag) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);

        if (tag == null || tag.isBlank()) {
            return getProvider(source).getGames(safePage, safeSize);
        }

        if (isBlockedAdultContent(tag)) {
            return emptyGamePage(safePage, safeSize);
        }

        return getProvider(source).getGames(safePage, safeSize, tag);
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_DETAIL,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + (#externalId == null ? '' : #externalId.trim().toLowerCase())",
            unless = "#result == null"
    )
    public ExternalGameDetailResponse getDetail(GameSource source, String externalId) {
        ExternalGameDetailResponse detail = getProvider(source).getGameDetail(externalId);

        if (detail != null && isBlockedAdultContent(detail.getTitle())) {
            throw new RuntimeException("Bu oyun platform içerik filtresi nedeniyle gösterilemiyor.");
        }

        return detail;
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_CATEGORIES,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + (#query == null ? '' : #query.trim().toLowerCase())",
            unless = "#result == null"
    )
    public List<ExternalGameCategoryResponse> getCategories(GameSource source, String query) {
        return getProvider(source).getCategories(query)
                .stream()
                .filter(category -> !isBlockedAdultContent(category.getName()))
                .filter(category -> !isBlockedAdultContent(category.getExternalId()))
                .collect(Collectors.toList());
    }

    public List<ExternalGameTagResponse> getTags(GameSource source) {
        return getProvider(source).getTags()
                .stream()
                .filter(tag -> !isBlockedAdultContent(tag.getName()))
                .filter(tag -> !isBlockedAdultContent(tag.getExternalId()))
                .collect(Collectors.toList());
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_PLATFORMS,
            key = "'all'",
            unless = "#result == null"
    )
    public List<ExternalGamePlatformResponse> getPlatforms() {
        return providers.values()
                .stream()
                .map(ExternalGameProvider::getPlatformInfo)
                .collect(Collectors.toList());
    }

    private ExternalGameProvider getProvider(GameSource source) {
        ExternalGameProvider provider = providers.get(source);

        if (provider == null) {
            throw new RuntimeException("Desteklenmeyen oyun kaynağı: " + source);
        }

        return provider;
    }

    private boolean isBlockedAdultContent(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalizedValue = normalizeText(value);

        return BLOCKED_ADULT_CONTENT_KEYWORDS.stream()
                .anyMatch(keyword -> normalizedValue.contains(normalizeText(keyword)));
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

    private ExternalGamePageResponse emptyGamePage(int page, int size) {
        return new ExternalGamePageResponse(
                List.of(),
                page,
                size,
                0,
                0
        );
    }
}