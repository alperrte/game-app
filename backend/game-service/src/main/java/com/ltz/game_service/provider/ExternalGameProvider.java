package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameCategoryResponse;
import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePageResponse;
import com.ltz.game_service.dto.response.external.ExternalGamePlatformResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.dto.response.external.ExternalGameTagResponse;
import com.ltz.game_service.enums.GameSource;

import java.util.List;

public interface ExternalGameProvider {

    GameSource getSource();

    List<ExternalGameSearchResponse> searchGames(String query);

    List<ExternalGameSearchResponse> getPopularGames();

    ExternalGamePageResponse getGames(int page, int size);

    ExternalGameDetailResponse getGameDetail(String externalId);

    List<ExternalGameCategoryResponse> getCategories(String query);

    List<ExternalGameTagResponse> getTags();

    ExternalGamePlatformResponse getPlatformInfo();
}