package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePageResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.response.external.ExternalGameTagResponse;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EpicGameProvider implements ExternalGameProvider {

    @Override
    public GameSource getSource() {
        return GameSource.EPIC;
    }

    @Override
    public List<ExternalGameSearchResponse> searchGames(String query) {
        throw new UnsupportedOperationException("Epic Games provider henüz aktif değil.");
    }

    @Override
    public List<ExternalGameSearchResponse> getPopularGames() {
        return List.of();
    }

    @Override
    public ExternalGamePageResponse getGames(int page, int size) {
        return new ExternalGamePageResponse(
                List.of(),
                page,
                size,
                0,
                0
        );
    }

    @Override
    public ExternalGamePageResponse getGames(int page, int size, String tag) {
        return new ExternalGamePageResponse(
                List.of(),
                page,
                size,
                0,
                0
        );
    }

    @Override
    public ExternalGameDetailResponse getGameDetail(String externalId) {
        throw new UnsupportedOperationException("Epic Games provider henüz aktif değil.");
    }

    @Override
    public List<ExternalGameCategoryResponse> getCategories(String query) {
        throw new UnsupportedOperationException("Epic Games provider henüz aktif değil.");
    }

    @Override
    public List<ExternalGameTagResponse> getTags() {
        return List.of();
    }

    @Override
    public ExternalGamePlatformResponse getPlatformInfo() {
        return new ExternalGamePlatformResponse(
                GameSource.EPIC,
                "Epic Games Store",
                "Epic Games provider henüz aktif değil. İleride Epic Games Store verileri bu provider üzerinden sağlanacak.",
                "INACTIVE",
                0,
                null,
                2018,
                "Epic Games",
                "Not connected yet",
                null
        );
    }
}