package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePageResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.response.external.ExternalGameTagResponse;
import com.ltz.game_service.entity.enums.GameSource;

import java.util.List;

public interface ExternalGameProvider {

    GameSource getSource();

    List<ExternalGameSearchResponse> searchGames(String query);

    List<ExternalGameSearchResponse> getPopularGames();

    ExternalGamePageResponse getGames(int page, int size);

    ExternalGamePageResponse getGames(int page, int size, String tag);

    ExternalGameDetailResponse getGameDetail(String externalId);

    List<ExternalGameCategoryResponse> getCategories(String query);

    List<ExternalGameTagResponse> getTags();

    ExternalGamePlatformResponse getPlatformInfo();

    /**
     * Import job için öncelikli (kaliteli) aday oyun listesi. Artımlı import bu
     * listeyi sırayla tarayarak henüz işlenmemiş app'leri seçer.
     */
    default List<ExternalGameSearchResponse> getImportCandidates() {
        return List.of();
    }

    /**
     * Import job için tek bir oyunun detay + mağaza bilgisini döndürür.
     * Oyun bulunamaz, uygunsuz içerik ise veya kaynak desteklemiyorsa null döner.
     */
    default ExternalGameImportData fetchImportData(String externalId) {
        return null;
    }
}