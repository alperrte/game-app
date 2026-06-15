package com.ltz.game_service.service;

import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.enums.GameSource;
import com.ltz.game_service.provider.ExternalGameProvider;
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

    public List<ExternalGameSearchResponse> search(GameSource source, String query) {
        return getProvider(source).searchGames(query);
    }

    public ExternalGameDetailResponse getDetail(GameSource source, String externalId) {
        return getProvider(source).getGameDetail(externalId);
    }

    public List<ExternalGameCategoryResponse> getCategories(GameSource source, String query) {
        return getProvider(source).getCategories(query);
    }

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