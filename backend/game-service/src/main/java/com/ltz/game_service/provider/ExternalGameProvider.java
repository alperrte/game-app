package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.enums.GameSource;

import java.util.List;

public interface ExternalGameProvider {

    GameSource getSource();

    List<ExternalGameSearchResponse> searchGames(String query);

    ExternalGameDetailResponse getGameDetail(String externalId);
}