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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExternalGameService {

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
        return getProvider(source).searchGames(query);
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_POPULAR,
            key = "T(java.lang.String).valueOf(#source).toLowerCase()",
            unless = "#result == null"
    )
    public List<ExternalGameSearchResponse> getPopularGames(GameSource source) {
        return getProvider(source).getPopularGames();
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
        if (tag == null || tag.isBlank()) {
            return getProvider(source).getGames(page, size);
        }

        return getProvider(source).getGames(page, size, tag);
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_DETAIL,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + (#externalId == null ? '' : #externalId.trim().toLowerCase())",
            unless = "#result == null"
    )
    public ExternalGameDetailResponse getDetail(GameSource source, String externalId) {
        return getProvider(source).getGameDetail(externalId);
    }

    @Cacheable(
            cacheNames = CacheConfig.EXTERNAL_GAME_CATEGORIES,
            key = "T(java.lang.String).valueOf(#source).toLowerCase() + ':' + (#query == null ? '' : #query.trim().toLowerCase())",
            unless = "#result == null"
    )
    public List<ExternalGameCategoryResponse> getCategories(GameSource source, String query) {
        return getProvider(source).getCategories(query);
    }

    public List<ExternalGameTagResponse> getTags(GameSource source) {
        return getProvider(source).getTags();
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
}