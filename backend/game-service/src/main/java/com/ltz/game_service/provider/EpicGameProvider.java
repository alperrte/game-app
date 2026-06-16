package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.enums.GameSource;
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
    public ExternalGameDetailResponse getGameDetail(String externalId) {
        throw new UnsupportedOperationException("Epic Games provider henüz aktif değil.");
    }
}