package com.ltz.game_service.dto.response.external;

import com.ltz.game_service.entity.enums.GameSource;

public class ExternalGameSearchResponse {

    private GameSource source;
    private String externalId;
    private String title;
    private String coverImageUrl;

    public ExternalGameSearchResponse() {
    }

    public ExternalGameSearchResponse(GameSource source, String externalId, String title, String coverImageUrl) {
        this.source = source;
        this.externalId = externalId;
        this.title = title;
        this.coverImageUrl = coverImageUrl;
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
}